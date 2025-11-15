import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_TG_ID = 884253640;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// POST - Создать жалобу
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      reporterId, 
      reportedUserId, 
      reportType, 
      reason, 
      description,
      relatedAdId,
      relatedMessageId
    } = body;

    console.log('[REPORTS API] Получены данные:', {
      reporterId,
      reportedUserId,
      reportType,
      reason,
      description,
      relatedAdId,
      fullBody: body
    });

    // Проверяем что reporterId указан
    if (!reporterId || reporterId === 0) {
      console.error('[REPORTS API] reporterId отсутствует или равен 0:', reporterId);
      return NextResponse.json({ 
        error: 'Reporter ID is required',
        details: 'Не удалось определить отправителя жалобы. Убедитесь что вы авторизованы через Telegram.'
      }, { status: 400 });
    }

    // Проверяем что reportedUserId указан
    if (!reportedUserId || reportedUserId === 0) {
      console.error('[REPORTS API] reportedUserId отсутствует или равен 0:', reportedUserId);
      return NextResponse.json({ 
        error: 'Reported User ID is required',
        details: 'Не удалось определить на кого подана жалоба.'
      }, { status: 400 });
    }

    // Проверяем что пользователь не жалуется сам на себя
    if (reporterId === reportedUserId) {
      return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 });
    }

    // Проверяем что пользователь не создает дубликаты жалоб
    const existingReport = await sql`
      SELECT id FROM reports
      WHERE reporter_id = ${reporterId}
        AND reported_user_id = ${reportedUserId}
        AND status = 'pending'
        AND created_at > NOW() - INTERVAL '24 hours'
    `;
    
    if (existingReport.rows.length > 0) {
      return NextResponse.json({ 
        error: 'You already reported this user recently' 
      }, { status: 400 });
    }

    // Создаем жалобу
    const report = await sql`
      INSERT INTO reports (
        reporter_id, reported_user_id, report_type, reason, 
        description, related_ad_id, related_message_id
      )
      VALUES (
        ${reporterId}, ${reportedUserId}, ${reportType}, ${reason},
        ${description || null}, ${relatedAdId || null}, ${relatedMessageId || null}
      )
      RETURNING id, created_at
    `;

    const reportId = report.rows[0].id;

    // Получаем данные о пользователях (включая username)
    const reporterData = await sql`
      SELECT display_nickname, id, telegram_username FROM users WHERE id = ${reporterId}
    `;
    const reporterNick = reporterData.rows[0]?.display_nickname || 'Аноним';
    const reporterUsername = reporterData.rows[0]?.telegram_username;
    
    const reportedData = await sql`
      SELECT display_nickname, id, telegram_username FROM users WHERE id = ${reportedUserId}
    `;
    const reportedNick = reportedData.rows[0]?.display_nickname || 'Аноним';
    const reportedUsername = reportedData.rows[0]?.telegram_username;

    // Получаем текст анкеты если это жалоба на анкету
    let adText: string | undefined;
    if (reportType === 'ad' && relatedAdId) {
      const adData = await sql`
        SELECT text FROM ads WHERE id = ${relatedAdId}
      `;
      adText = adData.rows[0]?.text;
    }

    // Получаем историю чата если это жалоба на сообщение
    let chatHistoryData: Array<{nickname: string; message: string; timestamp: string}> | undefined;
    if (reportType === 'message' && (reporterId || reportedUserId)) {
      try {
        // Находим chat_id между двумя пользователями
        const chatResult = await sql`
          SELECT id FROM private_chats
          WHERE (user1_id = ${reporterId} AND user2_id = ${reportedUserId})
             OR (user1_id = ${reportedUserId} AND user2_id = ${reporterId})
          LIMIT 1
        `;
        
        if (chatResult.rows.length > 0) {
          const chatId = chatResult.rows[0].id;
          
          // Получаем последние 20 сообщений из этого чата
          const messages = await sql`
            SELECT m.message, m.sender_id, m.created_at, u.display_nickname
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.chat_id = ${chatId}
            ORDER BY m.created_at DESC
            LIMIT 20
          `;
          
          chatHistoryData = messages.rows.map(msg => ({
            nickname: msg.display_nickname || 'Аноним',
            message: msg.message,
            timestamp: new Date(msg.created_at).toLocaleString('ru-RU')
          })).reverse(); // Переворачиваем чтобы старые были сверху
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
        // Продолжаем без истории если произошла ошибка
      }
    }

    // Отправляем уведомление админу в Telegram
    await sendReportToAdmin({
      reportId,
      reporterNick,
      reporterId,
      reporterUsername,
      reportedNick,
      reportedUserId,
      reportedUsername,
      reportType,
      reason,
      description,
      adText,
      chatHistory: chatHistoryData
    });

    return NextResponse.json({ 
      success: true, 
      reportId 
    });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}

// GET - Получить жалобы (только для админа)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') || 'pending';

    // Проверяем что это админ
    if (!userId || parseInt(userId) !== ADMIN_TG_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Получаем жалобы
    const reports = await sql`
      SELECT 
        r.*,
        u1.display_nickname as reporter_nickname,
        u2.display_nickname as reported_nickname,
        a.title as ad_title
      FROM reports r
      LEFT JOIN users u1 ON r.reporter_id = u1.id
      LEFT JOIN users u2 ON r.reported_user_id = u2.id
      LEFT JOIN ads a ON r.related_ad_id = a.id
      WHERE r.status = ${status}
      ORDER BY r.created_at DESC
      LIMIT 50
    `;

    return NextResponse.json({ reports: reports.rows });
  } catch (error) {
    console.error('Error getting reports:', error);
    return NextResponse.json({ error: 'Failed to get reports' }, { status: 500 });
  }
}

// PATCH - Обработать жалобу (approve/reject)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, action, adminId, adminNotes } = body;

    // Проверяем что это админ
    if (adminId !== ADMIN_TG_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (action === 'approve') {
      // Одобрить жалобу и забанить пользователя
      const report = await sql`
        SELECT reported_user_id, reason, description
        FROM reports
        WHERE id = ${reportId}
      `;

      if (report.rows.length === 0) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }

      const reportedUserId = report.rows[0].reported_user_id;
      const banReason = `${report.rows[0].reason}: ${report.rows[0].description || 'По жалобе пользователя'}`;

      // Баним пользователя
      await sql`
        INSERT INTO banned_users (user_id, banned_by, reason, related_report_id)
        VALUES (${reportedUserId}, ${adminId}, ${banReason}, ${reportId})
        ON CONFLICT (user_id) DO NOTHING
      `;

      // Обновляем статус жалобы
      await sql`
        UPDATE reports
        SET status = 'approved',
            resolved_by = ${adminId},
            resolved_at = NOW(),
            admin_notes = ${adminNotes || null}
        WHERE id = ${reportId}
      `;

      return NextResponse.json({ 
        success: true, 
        message: 'User banned successfully' 
      });

    } else if (action === 'reject') {
      // Отклонить жалобу
      await sql`
        UPDATE reports
        SET status = 'rejected',
            resolved_by = ${adminId},
            resolved_at = NOW(),
            admin_notes = ${adminNotes || null}
        WHERE id = ${reportId}
      `;

      return NextResponse.json({ 
        success: true, 
        message: 'Report rejected' 
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing report:', error);
    return NextResponse.json({ error: 'Failed to process report' }, { status: 500 });
  }
}

// Отправка уведомления админу в Telegram
async function sendReportToAdmin(data: {
  reportId: number;
  reporterNick: string;
  reporterId: number;
  reporterUsername?: string;
  reportedNick: string;
  reportedUserId: number;
  reportedUsername?: string;
  reportType: string;
  reason: string;
  description?: string;
  adText?: string;
  chatHistory?: Array<{nickname: string; message: string; timestamp: string}>;
}) {
  if (!BOT_TOKEN) return;

  const reasonEmoji: Record<string, string> = {
    spam: '📢',
    porn: '🔞',
    harassment: '😡',
    fake: '🎭',
    underage: '👶',
    other: '⚠️'
  };

  const typeEmoji: Record<string, string> = {
    profile: '👤',
    message: '💬',
    ad: '📝'
  };

  const reporterInfo = data.reporterUsername 
    ? `👤 <b>Жалобу подал:</b> ${data.reporterNick} (ID: ${data.reporterId}) (@${data.reporterUsername})`
    : `👤 <b>Жалобу подал:</b> ${data.reporterNick} (ID: ${data.reporterId})`;
  
  const reportedInfo = data.reportedUsername
    ? `🎯 <b>На кого жалоба:</b> ${data.reportedNick} (ID: ${data.reportedUserId}) (@${data.reportedUsername})`
    : `🎯 <b>На кого жалоба:</b> ${data.reportedNick} (ID: ${data.reportedUserId})`;

  let message = `
🚨 <b>НОВАЯ ЖАЛОБА #${data.reportId}</b>

${typeEmoji[data.reportType] || '⚠️'} <b>Тип:</b> ${data.reportType}
${reasonEmoji[data.reason] || '⚠️'} <b>Причина:</b> ${data.reason}

${reporterInfo}
${reportedInfo}

${data.description ? `📝 <b>Описание:</b>\n${data.description}\n\n` : ''}`;

  // Добавляем текст анкеты если это жалоба на анкету
  if (data.adText && data.reportType === 'ad') {
    message += `📝 <b>Текст анкеты:</b>\n<code>${data.adText.substring(0, 500)}${data.adText.length > 500 ? '...' : ''}</code>\n\n`;
  }

  // Добавляем историю чата если это жалоба из чата
  if (data.chatHistory && data.chatHistory.length > 0 && data.reportType === 'message') {
    message += `💬 <b>История чата (последние ${data.chatHistory.length} сообщений):</b>\n`;
    data.chatHistory.forEach((msg, idx) => {
      message += `${idx + 1}. <b>${msg.nickname}:</b> ${msg.message} <i>(${msg.timestamp})</i>\n`;
    });
    message += '\n';
  }

  message += `🕐 <b>Время:</b> ${new Date().toLocaleString('ru-RU')}`;
  message = message.trim();

  const keyboard = {
    inline_keyboard: [
      [
        { text: '✅ Забанить', callback_data: `ban_${data.reportId}_${data.reportedUserId}` },
        { text: '❌ Отклонить', callback_data: `reject_${data.reportId}` }
      ]
    ]
  };

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_TG_ID,
        text: message,
        parse_mode: 'HTML',
        reply_markup: keyboard
      })
    });
  } catch (error) {
    console.error('Error sending report to admin:', error);
  }
}

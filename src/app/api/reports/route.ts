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

    // Проверяем что пользователь не жалуется сам на себя (только для авторизованных)
    if (reporterId && reporterId === reportedUserId) {
      return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 });
    }

    // Проверяем что пользователь не создает дубликаты жалоб (только для авторизованных)
    if (reporterId) {
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
    }

    // Создаем жалобу
    const report = await sql`
      INSERT INTO reports (
        reporter_id, reported_user_id, report_type, reason, 
        description, related_ad_id, related_message_id
      )
      VALUES (
        ${reporterId || null}, ${reportedUserId}, ${reportType}, ${reason},
        ${description || null}, ${relatedAdId || null}, ${relatedMessageId || null}
      )
      RETURNING id, created_at
    `;

    const reportId = report.rows[0].id;

    // Получаем данные о пользователях
    let reporterNick = 'Анонимный пользователь';
    if (reporterId) {
      const reporterData = await sql`
        SELECT display_nickname, id FROM users WHERE id = ${reporterId}
      `;
      reporterNick = reporterData.rows[0]?.display_nickname || 'Аноним';
    }
    
    const reportedData = await sql`
      SELECT display_nickname, id FROM users WHERE id = ${reportedUserId}
    `;
    const reportedNick = reportedData.rows[0]?.display_nickname || 'Аноним';

    // Отправляем уведомление админу в Telegram
    await sendReportToAdmin({
      reportId,
      reporterNick,
      reporterId,
      reportedNick,
      reportedUserId,
      reportType,
      reason,
      description
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
  reportedNick: string;
  reportedUserId: number;
  reportType: string;
  reason: string;
  description?: string;
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

  const reporterInfo = data.reporterId 
    ? `👤 <b>Жалобу подал:</b> ${data.reporterNick} (ID: ${data.reporterId})`
    : `👤 <b>Жалобу подал:</b> ${data.reporterNick} (анонимно)`;

  const message = `
🚨 <b>НОВАЯ ЖАЛОБА #${data.reportId}</b>

${typeEmoji[data.reportType] || '⚠️'} <b>Тип:</b> ${data.reportType}
${reasonEmoji[data.reason] || '⚠️'} <b>Причина:</b> ${data.reason}

${reporterInfo}
🎯 <b>На кого жалоба:</b> ${data.reportedNick} (ID: ${data.reportedUserId})

${data.description ? `📝 <b>Описание:</b>\n${data.description}\n` : ''}
🕐 <b>Время:</b> ${new Date().toLocaleString('ru-RU')}
  `.trim();

  const keyboard = {
    inline_keyboard: [
      [
        { text: '✅ Забанить', callback_data: `ban_${data.reportId}_${data.reportedUserId}` },
        { text: '❌ Отклонить', callback_data: `reject_${data.reportId}` }
      ],
      [
        { text: '👤 Профиль нарушителя', url: `https://anonimka.kz/webapp/?userId=${data.reportedUserId}` }
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

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { sendPushNotification } from '@/utils/fcm';

export const dynamic = 'force-dynamic';

type AdminAction =
  | 'get-overview'
  | 'get-ads'
  | 'get-chats'
  | 'get-users'
  | 'ban-user'
  | 'unban-user'
  | 'block-ad'
  | 'unblock-ad'
  | 'notify-user'
  | 'get-chat-messages'
  | 'get-user-chats'
  | 'delete-message'
  | 'delete-ad';

type AdminUser = {
  user_token: string;
  id: number | null;
  display_nickname: string | null;
};

async function requireAdmin(adminToken?: string | null): Promise<AdminUser | null> {
  if (!adminToken) return null;
  const res = await sql`
    SELECT user_token, id, display_nickname
    FROM users
    WHERE user_token = ${adminToken} AND is_admin = TRUE
    LIMIT 1
  `;
  if (res.rows.length === 0) return null;
  return res.rows[0] as AdminUser;
}

function badRequest(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function parseDurationHours(value?: number | null) {
  if (value === undefined || value === null) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action: AdminAction | undefined = body?.action;
  const params = body?.params || {};
  const adminToken: string | undefined = body?.adminToken || req.headers.get('x-admin-token') || undefined;

  const admin = await requireAdmin(adminToken);
  if (!admin) {
    return badRequest('Admin privileges required', 403);
  }

  try {
    switch (action) {
      case 'get-overview': {
        const [usersCount, adsCount, chatsCount, bannedUsers, blockedAds] = await Promise.all([
          sql`SELECT COUNT(*)::int AS count FROM users`,
          sql`SELECT COUNT(*)::int AS count FROM ads`,
          sql`SELECT COUNT(*)::int AS count FROM private_chats`,
          sql`SELECT COUNT(*)::int AS count FROM users WHERE is_banned = TRUE`,
          sql`SELECT COUNT(*)::int AS count FROM ads WHERE COALESCE(is_blocked, false) = TRUE AND (blocked_until IS NULL OR blocked_until > NOW())`
        ]);

        return NextResponse.json({
          success: true,
          data: {
            users: usersCount.rows[0]?.count || 0,
            ads: adsCount.rows[0]?.count || 0,
            chats: chatsCount.rows[0]?.count || 0,
            bannedUsers: bannedUsers.rows[0]?.count || 0,
            blockedAds: blockedAds.rows[0]?.count || 0,
          }
        });
      }

      case 'get-ads': {
        const limit = Math.min(Number(params?.limit) || 200, 500);
        const ads = await sql`
          SELECT 
            ads.id,
            ads.user_token,
            ads.tg_id,
            ads.display_nickname,
            ads.gender,
            ads.target,
            ads.goal,
            ads.city,
            ads.country,
            ads.created_at,
            ads.is_pinned,
            ads.is_blocked,
            ads.blocked_reason,
            ads.blocked_until,
            ads.blocked_by_admin,
            ads.blocked_at
          FROM ads
          ORDER BY ads.created_at DESC
          LIMIT ${limit}
        `;

        return NextResponse.json({ success: true, data: ads.rows });
      }

      case 'get-chats': {
        const limit = Math.min(Number(params?.limit) || 150, 400);
        const chats = await sql`
          SELECT 
            pc.id,
            pc.ad_id,
            pc.user_token_1,
            pc.user_token_2,
            pc.accepted,
            pc.blocked_by,
            pc.blocked_by_token,
            pc.created_at,
            pc.last_message_at,
            (SELECT message FROM messages WHERE chat_id = pc.id ORDER BY created_at DESC LIMIT 1) AS last_message,
            (SELECT display_nickname FROM users WHERE user_token = pc.user_token_1 LIMIT 1) AS user1_nickname,
            (SELECT display_nickname FROM users WHERE user_token = pc.user_token_2 LIMIT 1) AS user2_nickname
          FROM private_chats pc
          ORDER BY pc.created_at DESC
          LIMIT ${limit}
        `;

        return NextResponse.json({ success: true, data: chats.rows });
      }

      case 'get-users': {
        const limit = Math.min(Number(params?.limit) || 200, 500);
        const search = (params?.search as string | undefined)?.trim();
        const bannedOnly = Boolean(params?.bannedOnly);
        const pattern = search ? `%${search}%` : null;
        let result;

        if (search && bannedOnly) {
          result = await sql`
            SELECT id, user_token, email, display_nickname, is_admin, is_banned, banned_until, ban_reason, banned_at, created_at, updated_at
            FROM users
            WHERE is_banned = TRUE
              AND (display_nickname ILIKE ${pattern} OR email ILIKE ${pattern} OR user_token ILIKE ${pattern})
            ORDER BY created_at DESC
            LIMIT ${limit}
          `;
        } else if (search) {
          result = await sql`
            SELECT id, user_token, email, display_nickname, is_admin, is_banned, banned_until, ban_reason, banned_at, created_at, updated_at
            FROM users
            WHERE display_nickname ILIKE ${pattern} OR email ILIKE ${pattern} OR user_token ILIKE ${pattern}
            ORDER BY created_at DESC
            LIMIT ${limit}
          `;
        } else if (bannedOnly) {
          result = await sql`
            SELECT id, user_token, email, display_nickname, is_admin, is_banned, banned_until, ban_reason, banned_at, created_at, updated_at
            FROM users
            WHERE is_banned = TRUE
            ORDER BY created_at DESC
            LIMIT ${limit}
          `;
        } else {
          result = await sql`
            SELECT id, user_token, email, display_nickname, is_admin, is_banned, banned_until, ban_reason, banned_at, created_at, updated_at
            FROM users
            ORDER BY created_at DESC
            LIMIT ${limit}
          `;
        }

        return NextResponse.json({ success: true, data: result.rows });
      }

      case 'ban-user': {
        const targetToken: string | undefined = params?.userToken;
        if (!targetToken) return badRequest('userToken is required');

        const durationHours = parseDurationHours(params?.durationHours);
        const banUntil = durationHours ? new Date(Date.now() + durationHours * 60 * 60 * 1000) : null;
        const reason: string = params?.reason || 'Blocked by admin';

        const res = await sql`
          UPDATE users
          SET 
            is_banned = TRUE,
            ban_reason = ${reason},
            banned_at = NOW(),
            banned_by = ${admin.id ?? null},
            banned_by_token = ${admin.user_token},
            banned_until = ${banUntil ? banUntil.toISOString() : null},
            updated_at = NOW()
          WHERE user_token = ${targetToken}
          RETURNING id, user_token, display_nickname, is_banned, ban_reason, banned_until
        `;

        if (res.rows.length === 0) return badRequest('User not found', 404);

        return NextResponse.json({ success: true, data: res.rows[0] });
      }

      case 'unban-user': {
        const targetToken: string | undefined = params?.userToken;
        if (!targetToken) return badRequest('userToken is required');

        const res = await sql`
          UPDATE users
          SET 
            is_banned = FALSE,
            ban_reason = NULL,
            banned_at = NULL,
            banned_by = NULL,
            banned_by_token = NULL,
            banned_until = NULL,
            updated_at = NOW()
          WHERE user_token = ${targetToken}
          RETURNING id, user_token, display_nickname, is_banned
        `;

        if (res.rows.length === 0) return badRequest('User not found', 404);

        return NextResponse.json({ success: true, data: res.rows[0] });
      }

      case 'block-ad': {
        const adId: number | undefined = params?.adId;
        if (!adId) return badRequest('adId is required');

        const durationHours = parseDurationHours(params?.durationHours);
        const blockUntil = durationHours ? new Date(Date.now() + durationHours * 60 * 60 * 1000) : null;
        const reason: string = params?.reason || 'Blocked by admin';

        const res = await sql`
          UPDATE ads
          SET 
            is_blocked = TRUE,
            blocked_reason = ${reason},
            blocked_until = ${blockUntil ? blockUntil.toISOString() : null},
            blocked_by_admin = ${admin.user_token},
            blocked_at = NOW()
          WHERE id = ${adId}
          RETURNING id, is_blocked, blocked_reason, blocked_until, blocked_by_admin, blocked_at
        `;

        if (res.rows.length === 0) return badRequest('Ad not found', 404);

        return NextResponse.json({ success: true, data: res.rows[0] });
      }

      case 'unblock-ad': {
        const adId: number | undefined = params?.adId;
        if (!adId) return badRequest('adId is required');

        const res = await sql`
          UPDATE ads
          SET 
            is_blocked = FALSE,
            blocked_reason = NULL,
            blocked_until = NULL,
            blocked_by_admin = NULL,
            blocked_at = NULL
          WHERE id = ${adId}
          RETURNING id, is_blocked
        `;

        if (res.rows.length === 0) return badRequest('Ad not found', 404);

        return NextResponse.json({ success: true, data: res.rows[0] });
      }

      case 'notify-user': {
        const targetToken: string | undefined = params?.userToken;
        const title: string = params?.title || 'Уведомление';
        const message: string = params?.message || '';

        if (!targetToken) return badRequest('userToken is required');
        if (!message.trim()) return badRequest('message is empty');

        const userRes = await sql`
          SELECT id, fcm_token, is_bot_blocked FROM users WHERE user_token = ${targetToken} LIMIT 1
        `;
        if (userRes.rows.length === 0) return badRequest('User not found', 404);
        const user = userRes.rows[0];

        let telegramSent = false;
        let pushSent = false;
        let telegramError: string | null = null;

        if (user.fcm_token) {
          try {
            pushSent = await sendPushNotification(user.fcm_token, {
              title,
              body: message,
              chatId: 'admin-notice',
              senderNickname: 'Admin'
            });
          } catch (err: any) {
            telegramError = err?.message || 'FCM send failed';
          }
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken && user.id && user.is_bot_blocked !== true) {
          try {
            const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: user.id,
                text: `🔔 Сообщение от администратора:\n\n${message}`,
                parse_mode: 'HTML'
              })
            });
            const json = await response.json();
            telegramSent = json?.ok === true;
            if (!telegramSent) {
              telegramError = json?.description || 'Telegram API error';
            }
          } catch (err: any) {
            telegramError = err?.message || 'Telegram send failed';
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            telegramSent,
            pushSent,
            telegramError
          }
        });
      }

      case 'get-chat-messages': {
        const chatId: number | undefined = params?.chatId;
        if (!chatId) return badRequest('chatId is required');

        const messages = await sql`
          SELECT 
            id, chat_id, sender_token, message, created_at, is_read, sender_nickname, reply_to_id
          FROM messages 
          WHERE chat_id = ${chatId}
          ORDER BY created_at ASC
          LIMIT 500
        `;

        return NextResponse.json({ success: true, data: messages.rows });
      }

      case 'get-user-chats': {
        const userToken: string | undefined = params?.userToken;
        if (!userToken) return badRequest('userToken is required');

        const chats = await sql`
          SELECT 
            pc.id,
            pc.ad_id,
            pc.user_token_1,
            pc.user_token_2,
            pc.created_at,
            pc.last_message_at,
            (SELECT COUNT(*)::int FROM messages WHERE chat_id = pc.id) AS message_count,
            (SELECT message FROM messages WHERE chat_id = pc.id ORDER BY created_at DESC LIMIT 1) AS last_message,
            (SELECT display_nickname FROM users WHERE user_token = pc.user_token_1 LIMIT 1) AS user1_nickname,
            (SELECT display_nickname FROM users WHERE user_token = pc.user_token_2 LIMIT 1) AS user2_nickname
          FROM private_chats pc
          WHERE pc.user_token_1 = ${userToken} OR pc.user_token_2 = ${userToken}
          ORDER BY pc.last_message_at DESC NULLS LAST
          LIMIT 100
        `;

        return NextResponse.json({ success: true, data: chats.rows });
      }

      case 'delete-message': {
        const messageId: number | undefined = params?.messageId;
        if (!messageId) return badRequest('messageId is required');

        await sql`DELETE FROM messages WHERE id = ${messageId}`;

        return NextResponse.json({ success: true });
      }

      case 'delete-ad': {
        const adId: number | undefined = params?.adId;
        if (!adId) return badRequest('adId is required');

        // Удаляем связанные сообщения и чаты
        await sql`DELETE FROM messages WHERE chat_id IN (SELECT id FROM private_chats WHERE ad_id = ${adId})`;
        await sql`DELETE FROM private_chats WHERE ad_id = ${adId}`;
        await sql`DELETE FROM ads WHERE id = ${adId}`;

        return NextResponse.json({ success: true });
      }

      default:
        return badRequest('Unknown action');
    }
  } catch (error: any) {
    console.error('[ADMIN API] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return badRequest('Use POST with action', 405);
}

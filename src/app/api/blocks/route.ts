import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// Helper to detect schema of user_blocks
async function detectUserBlocksSchema() {
  const res = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'user_blocks'`;
  const cols = new Set(res.rows.map((r: any) => r.column_name));
  return {
    hasToken: cols.has('blocker_token') && cols.has('blocked_token'),
    hasIds: cols.has('blocker_id') && cols.has('blocked_id')
  };
}

// Helper to detect private_chats blocked_by_token support
async function detectPrivateChatsSchema() {
  const res = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'private_chats'`;
  const cols = new Set(res.rows.map((r: any) => r.column_name));
  return {
    hasBlockedByToken: cols.has('blocked_by_token'),
    hasBlockedBy: cols.has('blocked_by')
  };
}

// Resolve tg_id numeric ID from token (returns null if not found)
async function resolveTgId(token: string): Promise<number | null> {
  const res = await sql`SELECT tg_id FROM ads WHERE user_token = ${token} ORDER BY created_at DESC LIMIT 1`;
  return res.rows[0]?.tg_id ? Number(res.rows[0].tg_id) : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    switch (action) {
      case 'block-user': {
        const { blocker_token, blocked_token, blocked_display_nickname } = params || {};
        if (!blocker_token || !blocked_token) {
          return NextResponse.json({ error: { message: 'user_token не указан' } }, { status: 400 });
        }

        const schema = await detectUserBlocksSchema();
        const blockerId = await resolveTgId(blocker_token);
        const blockedId = await resolveTgId(blocked_token);

        // Получаем никнейм если не передан
        let nickname = blocked_display_nickname;
        if (!nickname) {
          // Сначала пробуем из users
          const userNickname = await sql`
            SELECT display_nickname FROM users 
            WHERE user_token = ${blocked_token} 
            LIMIT 1
          `;
          if (userNickname.rows.length > 0 && userNickname.rows[0].display_nickname) {
            nickname = userNickname.rows[0].display_nickname;
          }
        }

        let result: any = { rows: [] };
        if (schema.hasToken && blockerId && blockedId) {
          result = await sql`
            INSERT INTO user_blocks (blocker_token, blocked_token, blocked_display_nickname, created_at)
            VALUES (${blocker_token}, ${blocked_token}, ${nickname || 'Неизвестный'}, NOW())
            ON CONFLICT DO NOTHING
            RETURNING *
          `;
        } else if (schema.hasToken) {
          result = await sql`
            INSERT INTO user_blocks (blocker_token, blocked_token, blocked_display_nickname, created_at)
            VALUES (${blocker_token}, ${blocked_token}, ${nickname || 'Неизвестный'}, NOW())
            ON CONFLICT DO NOTHING
            RETURNING *
          `;
        } else if (schema.hasIds && blockerId && blockedId) {
          result = await sql`
            INSERT INTO user_blocks (blocker_id, blocked_id, created_at)
            VALUES (${blockerId}, ${blockedId}, NOW())
            ON CONFLICT DO NOTHING
            RETURNING *
          `;
        } else {
          return NextResponse.json({
            error: { message: 'Схема user_blocks старая и не поддерживает токены. Примените миграцию 011.' }
          }, { status: 500 });
        }

        // Note: private_chats blocking handled separately via blocked_by/blocked_by_token columns
        // Skipping update if columns don't exist to avoid errors
        console.log('[BLOCKS API] Block recorded in user_blocks table');

        return NextResponse.json({ data: result.rows[0] || { success: true }, error: null });
      }

      case 'unblock-user': {
        const { blocker_token, blocked_token } = params || {};
        if (!blocker_token || !blocked_token) {
          return NextResponse.json({ error: { message: 'user_token не указан' } }, { status: 400 });
        }
        const schema = await detectUserBlocksSchema();
        const blockerId = await resolveTgId(blocker_token);
        const blockedId = await resolveTgId(blocked_token);

        let deletedRows: any[] = [];
        if (schema.hasToken) {
          const delToken = await sql`
            DELETE FROM user_blocks
            WHERE blocker_token = ${blocker_token} AND blocked_token = ${blocked_token}
            RETURNING *
          `;
          deletedRows.push(...delToken.rows);
        }
        if (schema.hasIds && blockerId && blockedId) {
          const delIds = await sql`
            DELETE FROM user_blocks
            WHERE blocker_id = ${blockerId} AND blocked_id = ${blockedId}
            RETURNING *
          `;
          deletedRows.push(...delIds.rows);
        }

        // Clear blocked flags in private_chats (handle both numeric and token columns)
        const chatSchema = await detectPrivateChatsSchema();
        if (chatSchema.hasBlockedByToken && chatSchema.hasBlockedBy) {
          if (blockerId) {
            await sql`
              UPDATE private_chats
              SET blocked_by = NULL::bigint, blocked_by_token = NULL::text
              WHERE ((blocked_by = ${blockerId}) OR (blocked_by_token = ${blocker_token}))
                AND ((user_token_1 = ${blocker_token} AND user_token_2 = ${blocked_token})
                  OR (user_token_1 = ${blocked_token} AND user_token_2 = ${blocker_token}))
            `;
          } else {
            await sql`
              UPDATE private_chats
              SET blocked_by = NULL::bigint, blocked_by_token = NULL::text
              WHERE blocked_by_token = ${blocker_token}
                AND ((user_token_1 = ${blocker_token} AND user_token_2 = ${blocked_token})
                  OR (user_token_1 = ${blocked_token} AND user_token_2 = ${blocker_token}))
            `;
          }
        } else if (chatSchema.hasBlockedByToken) {
          await sql`
            UPDATE private_chats
            SET blocked_by_token = NULL::text
            WHERE blocked_by_token = ${blocker_token}
              AND ((user_token_1 = ${blocker_token} AND user_token_2 = ${blocked_token})
                OR (user_token_1 = ${blocked_token} AND user_token_2 = ${blocker_token}))
          `;
        } else if (chatSchema.hasBlockedBy && blockerId) {
          await sql`
            UPDATE private_chats
            SET blocked_by = NULL::bigint
            WHERE blocked_by = ${blockerId}
              AND ((user_token_1 = ${blocker_token} AND user_token_2 = ${blocked_token})
                OR (user_token_1 = ${blocked_token} AND user_token_2 = ${blocker_token}))
          `;
        }

        return NextResponse.json({ data: deletedRows[0] || { success: true }, error: null });
      }

      case 'check-block-status': {
        const { user1_token, user2_token } = params || {};
        if (!user1_token || !user2_token) {
          return NextResponse.json({ error: { message: 'user_token не указан' } }, { status: 400 });
        }
        const schema = await detectUserBlocksSchema();

        // Try token-based first
        if (schema.hasToken) {
          const res = await sql`
            SELECT blocker_token, blocked_token
            FROM user_blocks
            WHERE (blocker_token = ${user1_token} AND blocked_token = ${user2_token})
               OR (blocker_token = ${user2_token} AND blocked_token = ${user1_token})
            LIMIT 1
          `;
          if (res.rows.length > 0) {
            const row = res.rows[0];
            return NextResponse.json({
              data: {
                isBlocked: true,
                blockedByCurrentUser: row.blocker_token === user1_token,
                blockedByOther: row.blocker_token === user2_token,
                blocker_token: row.blocker_token,
                blocked_token: row.blocked_token
              },
              error: null
            });
          }
        }

        // Legacy fallback by numeric ids
        if (schema.hasIds) {
          const id1 = await resolveTgId(user1_token);
          const id2 = await resolveTgId(user2_token);
          if (id1 && id2) {
            const res = await sql`
              SELECT blocker_id, blocked_id
              FROM user_blocks
              WHERE (blocker_id = ${id1} AND blocked_id = ${id2})
                 OR (blocker_id = ${id2} AND blocked_id = ${id1})
              LIMIT 1
            `;
            if (res.rows.length > 0) {
              return NextResponse.json({
                data: {
                  isBlocked: true,
                  blockedByCurrentUser: res.rows[0].blocker_id === id1,
                  blockedByOther: res.rows[0].blocker_id === id2,
                  blocker_token: null,
                  blocked_token: null
                },
                error: null
              });
            }
          }
        }

        return NextResponse.json({ data: { isBlocked: false }, error: null });
      }

      case 'get-blocked-users': {
        const { user_token } = params || {};
        if (!user_token) {
          return NextResponse.json({ error: { message: 'user_token не указан' } }, { status: 400 });
        }
        const schema = await detectUserBlocksSchema();

        if (schema.hasToken) {
          const list = await sql`
            SELECT blocked_token, blocked_nickname, created_at AS blocked_at
            FROM user_blocks
            WHERE blocker_token = ${user_token}
            ORDER BY created_at DESC
          `;
          const enriched = await Promise.all(list.rows.map(async (row: any) => {
            // Используем сохраненный blocked_nickname, если он пустой - ищем в users
            let nickname = row.blocked_nickname;
            if (!nickname) {
              const userNick = await sql`SELECT display_nickname FROM users WHERE user_token = ${row.blocked_token} LIMIT 1`;
              nickname = userNick.rows[0]?.display_nickname || 'Собеседник';
            }
            return {
              blocked_token: row.blocked_token,
              blocked_at: row.blocked_at,
              nickname: nickname
            };
          }));
          return NextResponse.json({ data: enriched, error: null });
        }

        // Legacy fallback: try by numeric id
        if (schema.hasIds) {
            const numericId = await resolveTgId(user_token);
            if (!numericId) {
              return NextResponse.json({ data: [], error: null });
            }
            const list = await sql`
              SELECT blocked_id, created_at AS blocked_at
              FROM user_blocks
              WHERE blocker_id = ${numericId}
              ORDER BY created_at DESC
            `;
            const enriched = await Promise.all(list.rows.map(async (row: any) => {
              // Attempt to resolve token for blocked_id (may not exist)
              const tokenRes = await sql`SELECT user_token FROM ads WHERE tg_id = ${row.blocked_id} ORDER BY created_at DESC LIMIT 1`;
              return {
                blocked_token: tokenRes.rows[0]?.user_token || null,
                blocked_at: row.blocked_at,
                nickname: 'Собеседник'
              };
            }));
            return NextResponse.json({ data: enriched, error: null });
        }

        return NextResponse.json({ data: [], error: null });
      }

      default:
        return NextResponse.json({ error: { message: 'Неизвестное действие' } }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[BLOCKS API] Ошибка:', error);
    return NextResponse.json({ error: { message: error?.message || 'Ошибка сервера' } }, { status: 500 });
  }
}

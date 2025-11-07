import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    switch (action) {
      case 'block-user': {
        const { blocker_token, blocked_token } = params;
        if (!blocker_token || !blocked_token) {
          return NextResponse.json({ 
            error: { message: 'user_token не указан' } 
          }, { status: 400 });
        }
        // Добавляем блокировку
        const result = await sql`
          INSERT INTO user_blocks (blocker_token, blocked_token, created_at)
          VALUES (${blocker_token}, ${blocked_token}, NOW())
          ON CONFLICT (blocker_token, blocked_token) DO NOTHING
          RETURNING *
        `;
        // Обновляем чаты, помечаем как заблокированные
        await sql`
          UPDATE private_chats
          SET blocked_by = ${blocker_token}
          WHERE (user_token_1 = ${blocker_token} AND user_token_2 = ${blocked_token})
             OR (user_token_1 = ${blocked_token} AND user_token_2 = ${blocker_token})
        `;
        console.log('[BLOCKS API] Блокировка добавлена');
        return NextResponse.json({ 
          data: result.rows[0] || { success: true },
          error: null 
        });
      }

      case 'unblock-user': {
        const { blocker_token, blocked_token } = params;
        if (!blocker_token || !blocked_token) {
          return NextResponse.json({ 
            error: { message: 'user_token не указан' } 
          }, { status: 400 });
        }
        // Удаляем блокировку
        const result = await sql`
          DELETE FROM user_blocks
          WHERE blocker_token = ${blocker_token} AND blocked_token = ${blocked_token}
          RETURNING *
        `;
        // Убираем отметку blocked_by из чатов
        await sql`
          UPDATE private_chats
          SET blocked_by = NULL
          WHERE blocked_by = ${blocker_token}
            AND ((user_token_1 = ${blocker_token} AND user_token_2 = ${blocked_token})
                OR (user_token_1 = ${blocked_token} AND user_token_2 = ${blocker_token}))
        `;
        console.log('[BLOCKS API] Блокировка удалена');
        return NextResponse.json({ 
          data: result.rows[0] || { success: true },
          error: null 
        });
      }

      case 'check-block-status': {
        const { user1_token, user2_token } = params;
        if (!user1_token || !user2_token) {
          return NextResponse.json({ 
            error: { message: 'user_token не указан' } 
          }, { status: 400 });
        }
        // Проверяем блокировку в обе стороны
        const result = await sql`
          SELECT blocker_token, blocked_token
          FROM user_blocks
          WHERE (blocker_token = ${user1_token} AND blocked_token = ${user2_token})
             OR (blocker_token = ${user2_token} AND blocked_token = ${user1_token})
          LIMIT 1
        `;
        const blockData = result.rows[0];
        if (blockData) {
          return NextResponse.json({ 
            data: {
              isBlocked: true,
              blockedByCurrentUser: blockData.blocker_token == user1_token,
              blockedByOther: blockData.blocker_token == user2_token,
              blocker_token: blockData.blocker_token,
              blocked_token: blockData.blocked_token
            },
            error: null 
          });
        } else {
          return NextResponse.json({ 
            data: { isBlocked: false },
            error: null 
          });
        }
      }

      case 'get-blocked-users': {
        const { user_token } = params;
        
        if (!user_token) {
          return NextResponse.json({ 
            error: { message: 'user_token не указан' } 
          }, { status: 400 });
        }

        try {
          // Получаем список заблокированных пользователей
          const blockedList = await sql`
            SELECT blocked_token, created_at as blocked_at
            FROM user_blocks
            WHERE blocker_token = ${user_token}
            ORDER BY created_at DESC
          `;

          // Для каждого заблокированного получаем nickname из ads
          const blockedUsers = await Promise.all(
            blockedList.rows.map(async (block) => {
              try {
                const nicknameResult = await sql`
                  SELECT nickname
                  FROM ads
                  WHERE user_token = ${String(block.blocked_token)}
                  ORDER BY created_at DESC
                  LIMIT 1
                `;
                
                return {
                  blocked_token: block.blocked_token,
                  blocked_at: block.blocked_at,
                  nickname: nicknameResult.rows[0]?.nickname || 'Собеседник'
                };
              } catch (err) {
                return {
                  blocked_token: block.blocked_token,
                  blocked_at: block.blocked_at,
                  nickname: 'Собеседник'
                };
              }
            })
          );

          return NextResponse.json({ 
            data: blockedUsers,
            error: null 
          });
        } catch (error: any) {
          return NextResponse.json({ 
            error: { message: error?.message || 'Ошибка получения списка' } 
          }, { status: 500 });
        }
      }

      default:
        return NextResponse.json({ 
          error: { message: 'Неизвестное действие' } 
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[BLOCKS API] Ошибка:', error);
    return NextResponse.json({ 
      error: { message: error?.message || 'Ошибка сервера' } 
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    switch (action) {
      case 'block-user': {
        const { blockerId, blockedId } = params;
        
        if (!blockerId || !blockedId) {
          return NextResponse.json({ 
            error: { message: 'ID пользователей не указаны' } 
          }, { status: 400 });
        }

        // Добавляем блокировку
        const result = await sql`
          INSERT INTO user_blocks (blocker_id, blocked_id, created_at)
          VALUES (${blockerId}, ${blockedId}, NOW())
          ON CONFLICT (blocker_id, blocked_id) DO NOTHING
          RETURNING *
        `;

        // Обновляем чаты, помечаем как заблокированные
        await sql`
          UPDATE private_chats
          SET blocked_by = ${blockerId}
          WHERE (user1 = ${blockerId} AND user2 = ${blockedId})
             OR (user1 = ${blockedId} AND user2 = ${blockerId})
        `;

        console.log('[BLOCKS API] Пользователь заблокирован:', { blockerId, blockedId });
        return NextResponse.json({ 
          data: result.rows[0] || { success: true },
          error: null 
        });
      }

      case 'unblock-user': {
        const { blockerId, blockedId } = params;
        
        if (!blockerId || !blockedId) {
          return NextResponse.json({ 
            error: { message: 'ID пользователей не указаны' } 
          }, { status: 400 });
        }

        // Удаляем блокировку
        const result = await sql`
          DELETE FROM user_blocks
          WHERE blocker_id = ${blockerId} AND blocked_id = ${blockedId}
          RETURNING *
        `;

        // Убираем отметку blocked_by из чатов
        await sql`
          UPDATE private_chats
          SET blocked_by = NULL
          WHERE blocked_by = ${blockerId}
            AND ((user1 = ${blockerId} AND user2 = ${blockedId})
                OR (user1 = ${blockedId} AND user2 = ${blockerId}))
        `;

        console.log('[BLOCKS API] Пользователь разблокирован:', { blockerId, blockedId });
        return NextResponse.json({ 
          data: result.rows[0] || { success: true },
          error: null 
        });
      }

      case 'check-block-status': {
        const { user1, user2 } = params;
        
        if (!user1 || !user2) {
          return NextResponse.json({ 
            error: { message: 'ID пользователей не указаны' } 
          }, { status: 400 });
        }

        // Проверяем блокировку в обе стороны
        const result = await sql`
          SELECT blocker_id, blocked_id
          FROM user_blocks
          WHERE (blocker_id = ${user1} AND blocked_id = ${user2})
             OR (blocker_id = ${user2} AND blocked_id = ${user1})
          LIMIT 1
        `;

        const blockData = result.rows[0];
        
        if (blockData) {
          return NextResponse.json({ 
            data: {
              isBlocked: true,
              blockedByCurrentUser: blockData.blocker_id == user1,
              blockedByOther: blockData.blocker_id == user2,
              blockerId: blockData.blocker_id,
              blockedId: blockData.blocked_id
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
        const { userId } = params;
        
        if (!userId) {
          return NextResponse.json({ 
            error: { message: 'ID пользователя не указан' } 
          }, { status: 400 });
        }

        // Получаем список заблокированных пользователей с nickname из ads
        const result = await sql`
          SELECT 
            ub.blocked_id,
            ub.created_at as blocked_at,
            COALESCE(
              (
                SELECT a.nickname
                FROM ads a
                WHERE a.tg_id = CAST(ub.blocked_id AS TEXT)
                ORDER BY a.created_at DESC
                LIMIT 1
              ),
              'Собеседник'
            ) as nickname
          FROM user_blocks ub
          WHERE ub.blocker_id = ${userId}
          ORDER BY ub.created_at DESC
        `;

        console.log('[BLOCKS API] Получен список заблокированных:', { userId, count: result.rows.length, data: result.rows });
        return NextResponse.json({ 
          data: result.rows,
          error: null 
        });
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

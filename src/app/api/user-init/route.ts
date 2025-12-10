import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    if (action === 'initialize') {
      // Инициализация нового пользователя
      const { tg_id, tg_username, tg_first_name } = params || {};
      
      let userToken: string;
      
      if (tg_id) {
        // Для Telegram пользователей - генерируем детерминированный токен
        const secret = process.env.USER_TOKEN_SECRET || process.env.TOKEN_SECRET || 'fallback-secret';
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(String(tg_id));
        hmac.update(':v1');
        userToken = hmac.digest('hex');
        
        // Проверяем существующего пользователя
        const existing = await sql`
          SELECT id FROM users WHERE id = ${tg_id} LIMIT 1
        `;
        
        if (existing.rows.length === 0) {
          // Создаём нового пользователя
          try {
            await sql`
              INSERT INTO users (id, nickname, user_token, created_at, updated_at, last_active)
              VALUES (${tg_id}, ${tg_first_name || 'Аноним'}, ${userToken}, NOW(), NOW(), NOW())
              ON CONFLICT (id) DO UPDATE SET last_active = NOW(), updated_at = NOW()
            `;
          } catch (insertError) {
            // Игнорируем ошибки дублирования
            console.log('[API/user-init] User may already exist, updating activity');
          }
        } else {
          // Обновляем активность
          await sql`
            UPDATE users SET last_active = NOW(), updated_at = NOW() WHERE id = ${tg_id}
          `;
        }
      } else {
        // Веб-пользователь без Telegram - генерируем случайный токен
        userToken = crypto.randomBytes(16).toString('hex');
      }
      
      return NextResponse.json({
        success: true,
        data: { user_token: userToken }
      });
      
    } else if (action === 'heartbeat') {
      // Обновляем время последней активности
      const { user_token } = params || {};
      
      if (user_token) {
        try {
          await sql`
            UPDATE users SET last_active = NOW() WHERE user_token = ${user_token}
          `;
        } catch (e) {
          // Игнорируем ошибки - пользователь может не существовать
        }
      }
      
      return NextResponse.json({ success: true });
      
    } else {
      return NextResponse.json(
        { error: 'Unknown action' },
        { status: 400 }
      );
    }
    
  } catch (error: any) {
    console.error('[API/user-init] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'user-init' });
}

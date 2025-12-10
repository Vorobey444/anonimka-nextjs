import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    if (action === 'initialize') {
      // Инициализация нового пользователя
      const { tg_id, tg_username, tg_first_name } = params || {};
      
      // Генерируем уникальный токен
      const userToken = crypto.randomBytes(16).toString('hex');
      
      // Проверяем существующего пользователя по tg_id
      if (tg_id) {
        const existing = await sql`
          SELECT user_token FROM users WHERE tg_id = ${tg_id} LIMIT 1
        `;
        
        if (existing.rows.length > 0) {
          // Пользователь уже существует
          return NextResponse.json({
            success: true,
            data: { user_token: existing.rows[0].user_token }
          });
        }
        
        // Создаём нового пользователя
        await sql`
          INSERT INTO users (user_token, tg_id, nickname, created_at, last_active)
          VALUES (${userToken}, ${tg_id}, ${tg_first_name || 'Аноним'}, NOW(), NOW())
          ON CONFLICT (tg_id) DO UPDATE SET last_active = NOW()
        `;
      } else {
        // Веб-пользователь без Telegram
        await sql`
          INSERT INTO users (user_token, nickname, created_at, last_active)
          VALUES (${userToken}, 'Аноним', NOW(), NOW())
        `;
      }
      
      return NextResponse.json({
        success: true,
        data: { user_token: userToken }
      });
      
    } else if (action === 'heartbeat') {
      // Обновляем время последней активности
      const { user_token } = params || {};
      
      if (user_token) {
        await sql`
          UPDATE users SET last_active = NOW() WHERE user_token = ${user_token}
        `;
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

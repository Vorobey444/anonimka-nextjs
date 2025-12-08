import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

// Указываем, что это динамический роут
export const dynamic = 'force-dynamic';

// GET - Получить user_id по user_token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Ищем пользователя по токену в ads или users
    const adResult = await sql`
      SELECT DISTINCT tg_id FROM ads WHERE user_token = ${token} AND tg_id IS NOT NULL LIMIT 1
    `;

    if (adResult.rows.length > 0 && adResult.rows[0].tg_id) {
      return NextResponse.json({ 
        success: true, 
        userId: adResult.rows[0].tg_id 
      });
    }

    // Если не нашли в ads, ищем по premium_tokens
    const premiumResult = await sql`
      SELECT user_id FROM premium_tokens WHERE user_token = ${token} AND user_id IS NOT NULL LIMIT 1
    `;

    if (premiumResult.rows.length > 0 && premiumResult.rows[0].user_id) {
      return NextResponse.json({ 
        success: true, 
        userId: premiumResult.rows[0].user_id 
      });
    }

    // Не нашли
    return NextResponse.json({ 
      success: false, 
      error: 'User not found' 
    }, { status: 404 });

  } catch (error) {
    console.error('Error finding user by token:', error);
    return NextResponse.json({ error: 'Failed to find user' }, { status: 500 });
  }
}

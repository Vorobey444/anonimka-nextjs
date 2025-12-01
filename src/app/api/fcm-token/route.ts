import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

/**
 * POST /api/fcm-token
 * Регистрация FCM токена для push уведомлений
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, params } = body;

    switch (action) {
      case 'register': {
        const { userToken, fcmToken } = params;

        if (!userToken || !fcmToken) {
          return NextResponse.json(
            { success: false, error: 'Missing userToken or fcmToken' },
            { status: 400 }
          );
        }

        // Сохраняем FCM токен в базу
        await sql`
          UPDATE users 
          SET fcm_token = ${fcmToken}, 
              fcm_updated_at = NOW()
          WHERE user_token = ${userToken}
        `;

        console.log('[FCM] Токен зарегистрирован:', { 
          userToken: userToken.substring(0, 10) + '...', 
          fcmToken: fcmToken.substring(0, 20) + '...' 
        });

        return NextResponse.json({ 
          success: true, 
          message: 'FCM token registered' 
        });
      }

      case 'unregister': {
        const { userToken } = params;

        if (!userToken) {
          return NextResponse.json(
            { success: false, error: 'Missing userToken' },
            { status: 400 }
          );
        }

        // Удаляем FCM токен
        await sql`
          UPDATE users 
          SET fcm_token = NULL, 
              fcm_updated_at = NULL
          WHERE user_token = ${userToken}
        `;

        console.log('[FCM] Токен удален:', { 
          userToken: userToken.substring(0, 10) + '...' 
        });

        return NextResponse.json({ 
          success: true, 
          message: 'FCM token unregistered' 
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[FCM] API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

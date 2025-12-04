import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/test-cleanup - Удаление всех тестовых данных
 * Используется только E2E тестами для очистки после запуска
 * 
 * Body: { testIds: [999001, 999002, ...], secret: "test_cleanup_secret_key" }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { testIds, secret } = await request.json();

    // Простая защита от случайного вызова
    if (secret !== process.env.TEST_CLEANUP_SECRET && secret !== 'test_cleanup_secret_2024') {
      console.log('[TEST CLEANUP] ❌ Invalid secret');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!testIds || !Array.isArray(testIds) || testIds.length === 0) {
      return NextResponse.json(
        { error: 'testIds array required' },
        { status: 400 }
      );
    }

    console.log('[TEST CLEANUP] 🧹 Starting cleanup for IDs:', testIds);

    let deleted = {
      world_chat: 0,
      ads: 0,
      referrals: 0,
      users: 0,
      user_limits: 0,
      web_user_limits: 0,
      premium_tokens: 0
    };

    // Получаем токены пользователей для очистки
    let testTokens: string[] = [];
    if (testIds.length > 0) {
      const tokenResult = await sql`
        SELECT DISTINCT user_token FROM ads WHERE tg_id IN (${testIds.join(',')})
      `;
      testTokens = tokenResult.rows.map((r: any) => r.user_token).filter(Boolean);
    }

    console.log('[TEST CLEANUP] Found tokens:', testTokens.length);

    // 1. Удаляем сообщения из world_chat_messages
    if (testTokens.length > 0) {
      try {
        const wcResult = await sql`
          DELETE FROM world_chat_messages 
          WHERE user_token IN (${testTokens.join(',')})
        `;
        deleted.world_chat = wcResult.rowCount || 0;
        console.log(`[TEST CLEANUP] ✓ Deleted ${deleted.world_chat} world chat messages`);
      } catch (e) {
        console.warn('[TEST CLEANUP] World chat cleanup error:', e);
      }
    }

    // 2. Удаляем объявления (ads)
    try {
      let adsResult;
      if (testTokens.length > 0) {
        adsResult = await sql`
          DELETE FROM ads 
          WHERE tg_id IN (${testIds.join(',')}) OR user_token IN (${testTokens.join(',')})
        `;
      } else {
        adsResult = await sql`
          DELETE FROM ads WHERE tg_id IN (${testIds.join(',')})
        `;
      }
      deleted.ads = adsResult.rowCount || 0;
      console.log(`[TEST CLEANUP] ✓ Deleted ${deleted.ads} ads`);
    } catch (e) {
      console.warn('[TEST CLEANUP] Ads cleanup error:', e);
    }

    // 3. Удаляем реферальные записи
    try {
      let refResult;
      if (testTokens.length > 0) {
        refResult = await sql`
          DELETE FROM referrals 
          WHERE referrer_id IN (${testIds.join(',')}) 
             OR referred_id IN (${testIds.join(',')})
             OR referrer_token IN (${testTokens.join(',')})
             OR referred_token IN (${testTokens.join(',')})
        `;
      } else {
        refResult = await sql`
          DELETE FROM referrals 
          WHERE referrer_id IN (${testIds.join(',')}) OR referred_id IN (${testIds.join(',')})
        `;
      }
      deleted.referrals = refResult.rowCount || 0;
      console.log(`[TEST CLEANUP] ✓ Deleted ${deleted.referrals} referrals`);
    } catch (e) {
      console.warn('[TEST CLEANUP] Referrals cleanup error:', e);
    }

    // 4. Удаляем лимиты
    try {
      const limitsResult = await sql`
        DELETE FROM user_limits WHERE user_id IN (${testIds.join(',')})
      `;
      deleted.user_limits = limitsResult.rowCount || 0;
      console.log(`[TEST CLEANUP] ✓ Deleted ${deleted.user_limits} user_limits`);
    } catch (e) {
      console.warn('[TEST CLEANUP] User limits cleanup error:', e);
    }

    if (testTokens.length > 0) {
      try {
        const webLimitsResult = await sql`
          DELETE FROM web_user_limits WHERE user_token IN (${testTokens.join(',')})
        `;
        deleted.web_user_limits = webLimitsResult.rowCount || 0;
        console.log(`[TEST CLEANUP] ✓ Deleted ${deleted.web_user_limits} web_user_limits`);
      } catch (e) {
        console.warn('[TEST CLEANUP] Web limits cleanup error:', e);
      }
    }

    // 5. Удаляем premium_tokens
    if (testTokens.length > 0) {
      try {
        const premiumResult = await sql`
          DELETE FROM premium_tokens WHERE user_token IN (${testTokens.join(',')})
        `;
        deleted.premium_tokens = premiumResult.rowCount || 0;
        console.log(`[TEST CLEANUP] ✓ Deleted ${deleted.premium_tokens} premium_tokens`);
      } catch (e) {
        console.warn('[TEST CLEANUP] Premium tokens cleanup error:', e);
      }
    }

    // 6. Удаляем пользователей из users (в конце, т.к. есть foreign keys)
    try {
      const usersResult = await sql`
        DELETE FROM users WHERE id IN (${testIds.join(',')})
      `;
      deleted.users = usersResult.rowCount || 0;
      console.log(`[TEST CLEANUP] ✓ Deleted ${deleted.users} users`);
    } catch (e) {
      console.warn('[TEST CLEANUP] Users cleanup error:', e);
    }

    console.log('[TEST CLEANUP] 🎉 Cleanup complete:', deleted);

    return NextResponse.json({
      success: true,
      message: 'Test data cleaned up',
      deleted
    });

  } catch (error: any) {
    console.error('[TEST CLEANUP] ❌ Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Cleanup failed' 
      },
      { status: 500 }
    );
  }
}

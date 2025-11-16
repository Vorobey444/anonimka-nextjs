import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * POST /api/premium/activate
 * 
 * Активирует PRO подписку после оплаты через Telegram Stars
 * Вызывается ботом из successful_payment_callback()
 * 
 * Body:
 * {
 *   telegram_id: number,     // tg_id покупателя
 *   months: number,          // 1, 3, 6, 12
 *   transaction_id: string,  // ID транзакции Stars
 *   amount: number          // Сумма в Stars (50, 130, 215, 360)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { telegram_id, months, transaction_id, amount } = await request.json();
    
    console.log('[PREMIUM ACTIVATE] Запрос активации:', { telegram_id, months, transaction_id, amount });
    
    // Валидация входных данных
    if (!telegram_id || !months || !transaction_id || !amount) {
      console.error('[PREMIUM ACTIVATE] Недостаточно данных');
      return NextResponse.json(
        { error: 'Missing required fields: telegram_id, months, transaction_id, amount' },
        { status: 400 }
      );
    }
    
    // Валидация months (1, 3, 6, 12)
    if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(months)) {
      console.error('[PREMIUM ACTIVATE] Некорректное количество месяцев:', months);
      return NextResponse.json(
        { error: 'Invalid months value. Must be between 1 and 12' },
        { status: 400 }
      );
    }
    
    // Проверяем существует ли пользователь
    const userResult = await sql`
      SELECT id, is_premium, premium_until 
      FROM users 
      WHERE id = ${telegram_id}
    `;
    
    let newPremiumUntil: Date;
    const now = new Date();
    
    if (userResult.rows.length === 0) {
      // Пользователь не существует - создаём нового
      console.log('[PREMIUM ACTIVATE] Создаём нового пользователя:', telegram_id);
      
      newPremiumUntil = new Date(now);
      newPremiumUntil.setMonth(newPremiumUntil.getMonth() + months);
      
      await sql`
        INSERT INTO users (id, is_premium, premium_until, created_at, updated_at)
        VALUES (${telegram_id}, true, ${newPremiumUntil.toISOString()}, NOW(), NOW())
      `;
      
      console.log('[PREMIUM ACTIVATE] ✅ Новый пользователь создан с PRO до:', newPremiumUntil.toISOString());
      
    } else {
      // Пользователь существует - обновляем PRO статус
      const userData = userResult.rows[0];
      const currentUntil = userData.premium_until ? new Date(userData.premium_until) : null;
      
      console.log('[PREMIUM ACTIVATE] Существующий пользователь:', {
        id: userData.id,
        is_premium: userData.is_premium,
        current_until: currentUntil?.toISOString() || 'null'
      });
      
      // СТЕКИРОВАНИЕ: если PRO активен и не истёк, добавляем месяцы к текущему сроку
      if (userData.is_premium && currentUntil && currentUntil > now) {
        console.log('[PREMIUM ACTIVATE] СТЕКИРОВАНИЕ: PRO активен, добавляем', months, 'месяцев к', currentUntil.toISOString());
        newPremiumUntil = new Date(currentUntil);
        newPremiumUntil.setMonth(newPremiumUntil.getMonth() + months);
      } else {
        // PRO истёк или не был активен - начинаем с NOW()
        console.log('[PREMIUM ACTIVATE] НОВЫЙ ПЕРИОД: PRO истёк или не был активен');
        newPremiumUntil = new Date(now);
        newPremiumUntil.setMonth(newPremiumUntil.getMonth() + months);
      }
      
      await sql`
        UPDATE users
        SET is_premium = true,
            premium_until = ${newPremiumUntil.toISOString()},
            updated_at = NOW()
        WHERE id = ${telegram_id}
      `;
      
      console.log('[PREMIUM ACTIVATE] ✅ PRO обновлён до:', newPremiumUntil.toISOString());
    }
    
    // Записываем транзакцию для статистики
    await sql`
      INSERT INTO premium_transactions (
        user_id, 
        telegram_id, 
        months, 
        amount_stars, 
        transaction_id,
        payment_method,
        status,
        created_at
      )
      VALUES (
        ${telegram_id},
        ${telegram_id},
        ${months},
        ${amount},
        ${transaction_id},
        'stars',
        'completed',
        NOW()
      )
    `;
    
    console.log('[PREMIUM ACTIVATE] ✅ Транзакция записана:', transaction_id);
    
    // Проверяем не было ли дубля транзакции
    const duplicateCheck = await sql`
      SELECT COUNT(*) as count 
      FROM premium_transactions 
      WHERE transaction_id = ${transaction_id}
    `;
    
    if (duplicateCheck.rows[0].count > 1) {
      console.warn('[PREMIUM ACTIVATE] ⚠️ Обнаружен дубликат транзакции:', transaction_id);
    }
    
    return NextResponse.json({
      success: true,
      premium_until: newPremiumUntil.toISOString(),
      months,
      amount_stars: amount,
      stacked: userResult.rows.length > 0 && userResult.rows[0].is_premium && userResult.rows[0].premium_until && new Date(userResult.rows[0].premium_until) > now
    });
    
  } catch (error: any) {
    console.error('[PREMIUM ACTIVATE] ❌ Критическая ошибка:', error);
    console.error('[PREMIUM ACTIVATE] Stack:', error?.stack);
    
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

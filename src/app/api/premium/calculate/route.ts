import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/premium/calculate?months=5
 * 
 * Рассчитывает стоимость PRO подписки для указанного количества месяцев
 * Используется slider UI для отображения цены в реальном времени
 * 
 * Query params:
 * - months: number (1-12) - количество месяцев подписки
 * 
 * Response:
 * {
 *   months: number,
 *   stars: number,        // стоимость в Stars
 *   currency: "XTR",
 *   discount: number,     // процент скидки
 *   rub_equivalent: number,  // примерная стоимость в рублях (1 Star ≈ 2₽)
 *   kzt_equivalent: number   // примерная стоимость в тенге (1 Star ≈ 10₸)
 * }
 */

// Базовые цены со скидками
const PRICE_TIERS: Record<number, { stars: number; discount: number }> = {
  1: { stars: 50, discount: 0 },     // 499₸
  3: { stars: 130, discount: 17 },   // 1,299₸ (-17%)
  6: { stars: 215, discount: 30 },   // 2,149₸ (-30%)
  12: { stars: 360, discount: 41 }   // 3,499₸ (-41%)
};

/**
 * Расчёт цены для промежуточных месяцев (2, 4, 5, 7-11)
 * Используется линейная интерполяция между ключевыми точками
 */
function calculatePrice(months: number): { stars: number; discount: number } {
  // Базовые цены
  if (PRICE_TIERS[months]) {
    return PRICE_TIERS[months];
  }
  
  // Линейная интерполяция
  let stars: number;
  let discount: number;
  
  if (months === 2) {
    // Между 1 и 3: 50 → 130
    // 2 месяца: среднее арифметическое с учётом скидки
    const basePrice = 50 * 2;  // 100 Stars без скидки
    discount = 8;  // ~8% скидка
    stars = Math.floor(basePrice * (100 - discount) / 100);  // 92 Stars
  } else if (months === 4) {
    // Между 3 и 6
    const ratio = (months - 3) / (6 - 3);  // 1/3
    const starsInterpolated = 130 + (215 - 130) * ratio;  // ~158
    const discountInterpolated = 17 + (30 - 17) * ratio;  // ~21
    stars = Math.floor(starsInterpolated);
    discount = Math.floor(discountInterpolated);
  } else if (months === 5) {
    // Между 3 и 6
    const ratio = (months - 3) / (6 - 3);  // 2/3
    const starsInterpolated = 130 + (215 - 130) * ratio;  // ~187
    const discountInterpolated = 17 + (30 - 17) * ratio;  // ~26
    stars = Math.floor(starsInterpolated);
    discount = Math.floor(discountInterpolated);
  } else if (months >= 7 && months <= 11) {
    // Между 6 и 12
    const ratio = (months - 6) / (12 - 6);
    const starsInterpolated = 215 + (360 - 215) * ratio;
    const discountInterpolated = 30 + (41 - 30) * ratio;
    stars = Math.floor(starsInterpolated);
    discount = Math.floor(discountInterpolated);
  } else {
    // Неожиданное значение - возвращаем базовую цену
    stars = 50 * months;
    discount = 0;
  }
  
  return { stars, discount };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthsParam = searchParams.get('months');
    
    if (!monthsParam) {
      return NextResponse.json(
        { error: 'Missing required parameter: months' },
        { status: 400 }
      );
    }
    
    const months = parseInt(monthsParam);
    
    // Валидация
    if (isNaN(months) || months < 1 || months > 12) {
      return NextResponse.json(
        { error: 'Invalid months value. Must be between 1 and 12' },
        { status: 400 }
      );
    }
    
    // Расчёт цены
    const { stars, discount } = calculatePrice(months);
    
    // Эквиваленты в других валютах
    const rub_equivalent = stars * 2;  // 1 Star ≈ 2₽
    const kzt_equivalent = stars * 10; // 1 Star ≈ 10₸
    
    return NextResponse.json({
      months,
      stars,
      currency: 'XTR',
      discount,
      rub_equivalent,
      kzt_equivalent,
      price_without_discount: 50 * months
    });
    
  } catch (error: any) {
    console.error('[PREMIUM CALCULATE] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

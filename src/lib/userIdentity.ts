import { sql } from '@vercel/postgres';
import crypto from 'crypto';

/**
 * Утилиты для работы с идентификацией пользователей
 * Поддержка: Telegram ID и Email
 */

export type UserIdentityType = 'telegram' | 'email' | 'unknown';

export interface UserIdentity {
  type: UserIdentityType;
  id: number | null; // user.id из таблицы users
  tgId: number | null; // Telegram ID (если есть)
  email: string | null; // Email (если есть)
  userToken: string;
  authMethod: 'telegram' | 'email';
}

/**
 * Определяет тип пользователя по user_token
 * @param userToken - токен пользователя
 * @returns информация о пользователе
 */
export async function getUserIdentity(userToken: string): Promise<UserIdentity | null> {
  try {
    // Ищем пользователя в таблице users
    const userResult = await sql`
      SELECT 
        id,
        email,
        auth_method,
        user_token
      FROM users 
      WHERE user_token = ${userToken}
      LIMIT 1
    `;

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      
      // Если это Telegram пользователь, получаем tg_id
      let tgId = null;
      if (user.auth_method === 'telegram') {
        tgId = user.id; // В таблице users id === tg_id для Telegram пользователей
      }

      return {
        type: user.auth_method === 'email' ? 'email' : 'telegram',
        id: user.id,
        tgId,
        email: user.email,
        userToken: user.user_token,
        authMethod: user.auth_method
      };
    }

    // Если не нашли в users, ищем в ads (старые пользователи)
    const adResult = await sql`
      SELECT tg_id, user_token 
      FROM ads 
      WHERE user_token = ${userToken} 
      AND tg_id IS NOT NULL
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    if (adResult.rows.length > 0) {
      const ad = adResult.rows[0];
      return {
        type: 'telegram',
        id: ad.tg_id,
        tgId: ad.tg_id,
        email: null,
        userToken: ad.user_token,
        authMethod: 'telegram'
      };
    }

    return null;
  } catch (error) {
    console.error('[getUserIdentity] Error:', error);
    return null;
  }
}

/**
 * Получает user_token по email
 */
export async function getUserTokenByEmail(email: string): Promise<string | null> {
  try {
    const result = await sql`
      SELECT user_token 
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    `;
    return result.rows[0]?.user_token || null;
  } catch (error) {
    console.error('[getUserTokenByEmail] Error:', error);
    return null;
  }
}

/**
 * Получает user_token по Telegram ID
 */
export async function getUserTokenByTgId(tgId: number): Promise<string | null> {
  try {
    // Сначала ищем в users
    const userResult = await sql`
      SELECT user_token 
      FROM users 
      WHERE id = ${tgId} AND auth_method = 'telegram'
      LIMIT 1
    `;
    
    if (userResult.rows.length > 0) {
      return userResult.rows[0].user_token;
    }

    // Если не нашли, ищем в ads (старые пользователи)
    const adResult = await sql`
      SELECT user_token 
      FROM ads 
      WHERE tg_id = ${tgId}
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    return adResult.rows[0]?.user_token || null;
  } catch (error) {
    console.error('[getUserTokenByTgId] Error:', error);
    return null;
  }
}

/**
 * Генерирует детерминированный user_token для Telegram пользователя
 */
export function generateTelegramUserToken(tgId: number): string {
  const secret = process.env.USER_TOKEN_SECRET || process.env.TOKEN_SECRET || 'dev-temp-secret';
  if (!secret) {
    throw new Error('USER_TOKEN_SECRET не задан в переменных окружения');
  }
  if (tgId === null || tgId === undefined || tgId === '') {
    throw new Error('tgId не задан для генерации user_token');
  }
  try {
    const hmac = crypto.createHmac('sha256', secret);
    if (!hmac) {
      throw new Error('Failed to create HMAC object');
    }
    hmac.update(String(tgId));
    hmac.update(':v1');
    return hmac.digest('hex');
  } catch (error) {
    console.error('[generateTelegramUserToken] Error:', error);
    throw error;
  }
}

/**
 * Генерирует детерминированный user_token для Email пользователя
 * Использует HMAC-SHA256, как и для Telegram пользователей
 * Гарантирует, что одно и то же email всегда генерирует один и тот же токен
 */
export function generateEmailUserToken(email: string): string {
  if (!email || typeof email !== 'string' || email.trim() === '') {
    throw new Error('email не задан для генерации user_token');
  }
  const normalizedEmail = email.toLowerCase().trim();
  const secret = process.env.USER_TOKEN_SECRET || process.env.TOKEN_SECRET || 'dev-temp-secret';
  if (!secret) {
    throw new Error('USER_TOKEN_SECRET не задан в переменных окружения');
  }
  try {
    const hmac = crypto.createHmac('sha256', secret);
    if (!hmac) {
      throw new Error('Failed to create HMAC object');
    }
    hmac.update(normalizedEmail);
    hmac.update(':email:v1');
    return hmac.digest('hex');
  } catch (error) {
    console.error('[generateEmailUserToken] Error:', error);
    throw error;
  }
}

/**
 * Проверяет, является ли строка валидным user_token
 */
export function isValidUserToken(token: string): boolean {
  return /^[0-9a-f]{64}$/i.test(token);
}

/**
 * Получает идентификатор пользователя для логирования/отладки
 * Не раскрывает приватные данные
 */
export function getUserDisplayId(identity: UserIdentity | null): string {
  if (!identity) return 'unknown';
  
  if (identity.type === 'telegram' && identity.tgId) {
    return `tg:${identity.tgId}`;
  }
  
  if (identity.type === 'email' && identity.email) {
    // Показываем только первые 3 символа email
    const masked = identity.email.substring(0, 3) + '***';
    return `email:${masked}`;
  }
  
  return `token:${identity.userToken.substring(0, 8)}...`;
}

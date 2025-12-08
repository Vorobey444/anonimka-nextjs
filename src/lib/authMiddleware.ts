/**
 * Middleware helpers для API endpoints
 * Автоматическое определение типа пользователя (Telegram vs Email)
 */

import { NextRequest } from 'next/server';
import { getUserIdentity, UserIdentity } from './userIdentity';

export interface AuthenticatedRequest {
  userIdentity: UserIdentity;
  userToken: string;
}

/**
 * Извлекает user_token из тела запроса или query параметров
 */
export async function extractUserToken(request: NextRequest): Promise<string | null> {
  // Проверяем query параметры
  const { searchParams } = request.nextUrl;
  let userToken = searchParams.get('userToken') || searchParams.get('token');
  
  if (userToken) return userToken;

  // Проверяем тело запроса
  try {
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      userToken = body.userToken || body.user_token || body.token;
      
      // Важно: т.к. мы уже прочитали body, нужно создать новый Request с тем же телом
      // Это для случаев, когда endpoint нужно будет повторно читать body
      if (userToken) {
        return userToken;
      }
    }
  } catch (e) {
    // Если не удалось прочитать тело - не страшно
  }

  return null;
}

/**
 * Middleware: Проверяет авторизацию и возвращает информацию о пользователе
 * Использовать в начале каждого защищенного endpoint
 */
export async function authenticate(request: NextRequest): Promise<AuthenticatedRequest | null> {
  const userToken = await extractUserToken(request);
  
  if (!userToken) {
    console.warn('[AUTH] No userToken provided');
    return null;
  }

  const userIdentity = await getUserIdentity(userToken);
  
  if (!userIdentity) {
    console.warn('[AUTH] Invalid userToken:', userToken.substring(0, 8) + '...');
    return null;
  }

  return {
    userIdentity,
    userToken
  };
}

/**
 * Резолвит user ID из разных источников
 * Поддерживает: tgId, email, userToken
 * Возвращает UserIdentity или null
 */
export async function resolveUserIdentity(params: {
  tgId?: number | string;
  email?: string;
  userToken?: string;
}): Promise<UserIdentity | null> {
  const { tgId, email, userToken } = params;

  // Приоритет 1: userToken (наиболее надежный)
  if (userToken) {
    return await getUserIdentity(userToken);
  }

  // Приоритет 2: tgId
  if (tgId) {
    const numericTgId = typeof tgId === 'string' ? parseInt(tgId) : tgId;
    if (isNaN(numericTgId)) {
      console.warn('[resolveUserIdentity] Invalid tgId:', tgId);
      return null;
    }

    // Ищем в users
    const { sql } = await import('@vercel/postgres');
    const result = await sql`
      SELECT 
        id,
        email,
        auth_method,
        user_token
      FROM users 
      WHERE id = ${numericTgId} AND auth_method = 'telegram'
      LIMIT 1
    `;

    if (result.rows.length > 0) {
      const user = result.rows[0];
      return {
        type: 'telegram',
        id: user.id,
        tgId: user.id,
        email: user.email,
        userToken: user.user_token,
        authMethod: 'telegram'
      };
    }
  }

  // Приоритет 3: email
  if (email) {
    const { sql } = await import('@vercel/postgres');
    const result = await sql`
      SELECT 
        id,
        email,
        auth_method,
        user_token
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    `;

    if (result.rows.length > 0) {
      const user = result.rows[0];
      return {
        type: 'email',
        id: user.id,
        tgId: null,
        email: user.email,
        userToken: user.user_token,
        authMethod: 'email'
      };
    }
  }

  return null;
}

/**
 * Вспомогательная функция для логирования с контекстом пользователя
 */
export function logWithUser(identity: UserIdentity | null, message: string, ...args: any[]) {
  const userInfo = identity 
    ? `[${identity.type}:${identity.type === 'telegram' ? identity.tgId : identity.email?.substring(0, 5) + '***'}]`
    : '[unknown]';
  console.log(`${userInfo} ${message}`, ...args);
}

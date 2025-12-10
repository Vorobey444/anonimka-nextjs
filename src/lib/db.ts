import { sql } from '@vercel/postgres';

// Таймаут по умолчанию для запросов к БД (10 секунд)
const DEFAULT_TIMEOUT = 10000;

/**
 * Утилита для выполнения SQL запросов с таймаутом
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number = DEFAULT_TIMEOUT,
  errorMessage: string = 'Database query timeout'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), ms)
    ),
  ]);
}

/**
 * Безопасный SQL запрос с таймаутом
 */
export async function safeQuery<T>(
  queryFn: () => Promise<T>,
  timeout: number = DEFAULT_TIMEOUT
): Promise<T> {
  try {
    return await withTimeout(queryFn(), timeout, 'Database query timeout');
  } catch (error: any) {
    console.error('❌ Database query error:', error?.message || error);
    throw error;
  }
}

/**
 * Проверка подключения к БД
 */
export async function checkDbConnection(): Promise<boolean> {
  try {
    await withTimeout(sql`SELECT 1`, 5000, 'DB connection check timeout');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

export { sql };

import crypto from 'crypto';

/**
 * Генерирует user_token для пользователя по его Telegram ID
 * @param tgId - Telegram ID пользователя
 * @returns user_token (SHA-256 хеш)
 */
export function generateUserToken(tgId: number | string): string {
    const secret = process.env.USER_TOKEN_SECRET || process.env.TOKEN_SECRET || 'default-secret';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(String(tgId));
    hmac.update(':v1');
    return hmac.digest('hex');
}

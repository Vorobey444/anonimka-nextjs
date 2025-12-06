import crypto from 'crypto';

/**
 * Генерирует user_token для пользователя по его Telegram ID
 * @param tgId - Telegram ID пользователя
 * @returns user_token (SHA-256 хеш)
 */
export function generateUserToken(tgId: number | string): string {
    const secret = process.env.USER_TOKEN_SECRET || process.env.TOKEN_SECRET || 'default-secret';
    if (!secret) {
        throw new Error('USER_TOKEN_SECRET не задан в переменных окружения');
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
        console.error('Ошибка при генерации user_token:', error);
        throw error;
    }
}

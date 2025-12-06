import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import crypto from 'crypto';

// POST: Сохранить согласие пользователя с условиями
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        let { userToken, agreed, tgId } = body;

        // Если нет userToken, но есть tgId - генерируем userToken
        if (!userToken && tgId) {
            const secret = process.env.USER_TOKEN_SECRET || process.env.TOKEN_SECRET;
            if (!secret) {
                return NextResponse.json(
                    { success: false, error: 'Ошибка конфигурации сервера' },
                    { status: 500 }
                );
            }
            try {
                const hmac = crypto.createHmac('sha256', secret);
                if (!hmac) {
                    throw new Error('Failed to create HMAC object');
                }
                hmac.update(String(tgId));
                hmac.update(':v1');
                userToken = hmac.digest('hex');
                console.log(`[ONBOARDING] Сгенерирован userToken для tg_id ${tgId}`);
            } catch (hmacError) {
                console.error('[ONBOARDING POST] Ошибка при создании HMAC:', hmacError);
                return NextResponse.json(
                    { success: false, error: 'Ошибка генерации токена' },
                    { status: 500 }
                );
            }
        }

        if (!userToken) {
            return NextResponse.json(
                { success: false, error: 'Требуется userToken или tgId' },
                { status: 400 }
            );
        }

        // Сохраняем в таблицу users (единственное место хранения)
        // Всегда используем user_token для уникальности (работает для Telegram и Email пользователей)
        await sql`
            UPDATE users
            SET agreed_to_terms = ${agreed},
                updated_at = NOW()
            WHERE user_token = ${userToken}
        `;
        
        console.log(`[ONBOARDING] Согласие обновлено для пользователя ${userToken.substring(0, 16)}...`);

        return NextResponse.json({
            success: true,
            userToken: userToken,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Ошибка сохранения согласия:', error);
        return NextResponse.json(
            { success: false, error: 'Ошибка сохранения согласия' },
            { status: 500 }
        );
    }
}

// GET: Проверить статус согласия
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const userToken = searchParams.get('userToken');
        const tgId = searchParams.get('tgId');

        // Если нет userToken, но есть tgId - генерируем userToken
        let finalUserToken = userToken;
        if (!finalUserToken && tgId) {
            const secret = process.env.USER_TOKEN_SECRET || process.env.TOKEN_SECRET;
            if (secret) {
                try {
                    const hmac = crypto.createHmac('sha256', secret);
                    if (!hmac) {
                        throw new Error('Failed to create HMAC object');
                    }
                    hmac.update(String(tgId));
                    hmac.update(':v1');
                    finalUserToken = hmac.digest('hex');
                } catch (hmacError) {
                    console.error('[ONBOARDING GET] Ошибка при создании HMAC:', hmacError);
                    return NextResponse.json(
                        { success: false, error: 'Ошибка генерации токена' },
                        { status: 500 }
                    );
                }
            }
        }

        if (!finalUserToken) {
            return NextResponse.json(
                { success: false, error: 'Требуется userToken или tgId' },
                { status: 400 }
            );
        }

        // Проверяем в таблице users (единственное место хранения)
        let result;
        
        if (tgId) {
            // Telegram пользователь - ищем по id
            result = await sql`
                SELECT agreed_to_terms
                FROM users 
                WHERE id = ${Number(tgId)}
                LIMIT 1
            `;
        } else {
            // Web пользователь - ищем по user_token
            result = await sql`
                SELECT agreed_to_terms
                FROM users 
                WHERE user_token = ${finalUserToken}
                LIMIT 1
            `;
        }

        if (result.rows.length === 0) {
            return NextResponse.json({
                success: true,
                agreed: false
            });
        }

        return NextResponse.json({
            success: true,
            agreed: result.rows[0].agreed_to_terms || false
        });
    } catch (error) {
        console.error('Ошибка проверки согласия:', error);
        return NextResponse.json(
            { success: false, error: 'Ошибка проверки согласия' },
            { status: 500 }
        );
    }
}

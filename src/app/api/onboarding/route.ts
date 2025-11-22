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
            const hmac = crypto.createHmac('sha256', secret);
            hmac.update(String(tgId));
            hmac.update(':v1');
            userToken = hmac.digest('hex');
            console.log(`[ONBOARDING] Сгенерирован userToken для tg_id ${tgId}`);
        }

        if (!userToken) {
            return NextResponse.json(
                { success: false, error: 'Требуется userToken или tgId' },
                { status: 400 }
            );
        }

        // Сохраняем в таблицу users (единственное место хранения)
        if (tgId) {
            // Telegram пользователь - сохраняем по id
            const userId = Number(tgId);
            await sql`
                INSERT INTO users (id, user_token, agreed_to_terms, updated_at)
                VALUES (${userId}, ${userToken}, ${agreed}, NOW())
                ON CONFLICT (id) DO UPDATE
                SET user_token = ${userToken},
                    agreed_to_terms = ${agreed},
                    updated_at = NOW()
            `;
            console.log(`[ONBOARDING] Согласие сохранено для Telegram пользователя ${userId}`);
        } else {
            // Web пользователь - ищем по user_token или создаем с id=NULL
            const existingUser = await sql`
                SELECT id FROM users WHERE user_token = ${userToken} LIMIT 1
            `;
            
            if (existingUser.rows.length > 0) {
                // Обновляем существующего
                await sql`
                    UPDATE users
                    SET agreed_to_terms = ${agreed},
                        updated_at = NOW()
                    WHERE user_token = ${userToken}
                `;
            } else {
                // Создаем нового web-пользователя
                await sql`
                    INSERT INTO users (user_token, agreed_to_terms, created_at, updated_at)
                    VALUES (${userToken}, ${agreed}, NOW(), NOW())
                `;
            }
            console.log(`[ONBOARDING] Согласие сохранено для Web пользователя ${userToken.substring(0, 8)}...`);
        }

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
                const hmac = crypto.createHmac('sha256', secret);
                hmac.update(String(tgId));
                hmac.update(':v1');
                finalUserToken = hmac.digest('hex');
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

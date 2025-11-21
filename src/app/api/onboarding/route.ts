import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
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

        // Сохраняем в таблицу user_agreements
        await sql`
            INSERT INTO user_agreements (user_token, agreed_to_terms, agreed_at, updated_at)
            VALUES (
                ${userToken}, 
                ${agreed}, 
                ${agreed ? sql`NOW()` : null}, 
                NOW()
            )
            ON CONFLICT (user_token) DO UPDATE
            SET agreed_to_terms = ${agreed},
                agreed_at = CASE 
                    WHEN ${agreed} = true THEN NOW() 
                    ELSE user_agreements.agreed_at 
                END,
                updated_at = NOW()
        `;

        console.log(`[ONBOARDING] Согласие сохранено для user_token ${userToken.substring(0, 8)}...`);

        // Дополнительно синхронизируем в users для Telegram пользователей
        if (tgId) {
            const userId = Number(tgId);
            await sql`
                INSERT INTO users (id, agreed_to_terms, agreed_at, updated_at)
                VALUES (${userId}, ${agreed}, ${agreed ? sql`NOW()` : null}, NOW())
                ON CONFLICT (id) DO UPDATE
                SET agreed_to_terms = ${agreed},
                    agreed_at = CASE WHEN ${agreed} = true THEN NOW() ELSE users.agreed_at END,
                    updated_at = NOW()
            `;
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
        const { searchParams } = new URL(request.url);
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

        // Проверяем в таблице user_agreements
        const result = await sql`
            SELECT agreed_to_terms, agreed_at 
            FROM user_agreements 
            WHERE user_token = ${finalUserToken}
            LIMIT 1
        `;

        if (result.rows.length === 0) {
            return NextResponse.json({
                success: true,
                agreed: false
            });
        }

        return NextResponse.json({
            success: true,
            agreed: result.rows[0].agreed_to_terms || false,
            agreedAt: result.rows[0].agreed_at
        });
    } catch (error) {
        console.error('Ошибка проверки согласия:', error);
        return NextResponse.json(
            { success: false, error: 'Ошибка проверки согласия' },
            { status: 500 }
        );
    }
}

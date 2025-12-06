import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

const getSql = () => neon(process.env.DATABASE_URL!);

// POST - добавить/удалить реакцию
export async function POST(req: NextRequest) {
  try {
    const { message_id, emoji, user_token } = await req.json();

    if (!message_id || !emoji || !user_token) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const sql = getSql();

    // Проверяем, есть ли уже такая реакция от этого пользователя
    const existing = await sql`
      SELECT id FROM message_reactions
      WHERE message_id = ${message_id}
        AND user_token = ${user_token}
    `;

    if (existing.length > 0) {
      // Обновляем эмодзи
      await sql`
        UPDATE message_reactions
        SET emoji = ${emoji}, created_at = NOW()
        WHERE message_id = ${message_id}
          AND user_token = ${user_token}
      `;
    } else {
      // Добавляем новую реакцию
      await sql`
        INSERT INTO message_reactions (message_id, user_token, emoji)
        VALUES (${message_id}, ${user_token}, ${emoji})
      `;
    }

    // Получаем все реакции для этого сообщения
    const reactions = await sql`
      SELECT emoji, COUNT(*) as count
      FROM message_reactions
      WHERE message_id = ${message_id}
      GROUP BY emoji
    `;

    return NextResponse.json({
      success: true,
      reactions: reactions
    });

  } catch (error) {
    console.error('[REACTIONS API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add reaction' },
      { status: 500 }
    );
  }
}

// GET - получить реакции для сообщения
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('message_id');

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'message_id is required' },
        { status: 400 }
      );
    }

    const sql = getSql();
    const reactions = await sql`
      SELECT emoji, COUNT(*) as count
      FROM message_reactions
      WHERE message_id = ${messageId}
      GROUP BY emoji
    `;

    return NextResponse.json({
      success: true,
      reactions: reactions
    });

  } catch (error) {
    console.error('[REACTIONS API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get reactions' },
      { status: 500 }
    );
  }
}

// DELETE - удалить свою реакцию
export async function DELETE(req: NextRequest) {
  try {
    const user_token = req.headers.get('X-User-Token');
    const { message_id, emoji } = await req.json();

    if (!message_id || !user_token) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const sql = getSql();

    // Удаляем реакцию с учетом emoji (для точности)
    if (emoji) {
      await sql`
        DELETE FROM message_reactions
        WHERE message_id = ${message_id}
          AND user_token = ${user_token}
          AND emoji = ${emoji}
      `;
    } else {
      // Если emoji не передан, удаляем любую реакцию пользователя на это сообщение
      await sql`
        DELETE FROM message_reactions
        WHERE message_id = ${message_id}
          AND user_token = ${user_token}
      `;
    }

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('[REACTIONS API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete reaction' },
      { status: 500 }
    );
  }
}

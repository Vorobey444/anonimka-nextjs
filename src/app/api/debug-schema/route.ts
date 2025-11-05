import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Проверяем типы колонок в таблицах
    const adsSchema = await sql`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'ads' AND column_name IN ('tg_id', 'user_token')
      ORDER BY ordinal_position;
    `;

    const chatsSchema = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'private_chats' AND column_name IN ('user1', 'user2', 'user_token_1', 'user_token_2')
      ORDER BY ordinal_position;
    `;

    const messagesSchema = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'messages' AND column_name IN ('sender_id', 'sender_token')
      ORDER BY ordinal_position;
    `;

    return NextResponse.json({
      ads: adsSchema.rows,
      private_chats: chatsSchema.rows,
      messages: messagesSchema.rows
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    switch (action) {
      case 'check-existing': {
        const { user1, user2, adId } = params;
        const result = await sql`
          SELECT id, accepted, blocked_by 
          FROM private_chats 
          WHERE user1 = ${user1} AND user2 = ${user2} AND ad_id = ${adId}
          LIMIT 1
        `;
        return NextResponse.json({ data: result.rows[0] || null, error: null });
      }

      case 'create': {
        const { user1, user2, adId } = params;
        const result = await sql`
          INSERT INTO private_chats (user1, user2, ad_id, accepted)
          VALUES (${user1}, ${user2}, ${adId}, false)
          RETURNING *
        `;
        return NextResponse.json({ data: result.rows[0], error: null });
      }

      case 'get-pending': {
        const { userId } = params;
        const result = await sql`
          SELECT * FROM private_chats 
          WHERE user2 = ${userId} 
            AND accepted = false 
            AND blocked_by IS NULL
          ORDER BY created_at DESC
        `;
        return NextResponse.json({ data: result.rows, error: null });
      }

      case 'get-active': {
        const { userId } = params;
        const result = await sql`
          SELECT * FROM private_chats 
          WHERE (user1 = ${userId} OR user2 = ${userId})
            AND accepted = true 
            AND blocked_by IS NULL
          ORDER BY created_at DESC
        `;
        return NextResponse.json({ data: result.rows, error: null });
      }

      case 'accept': {
        const { chatId, userId } = params;
        const result = await sql`
          UPDATE private_chats 
          SET accepted = true 
          WHERE id = ${chatId} AND user2 = ${userId}
          RETURNING *
        `;
        return NextResponse.json({ data: result.rows[0], error: null });
      }

      case 'reject': {
        const { chatId, userId } = params;
        const result = await sql`
          DELETE FROM private_chats 
          WHERE id = ${chatId} AND user2 = ${userId}
          RETURNING *
        `;
        return NextResponse.json({ data: result.rows[0], error: null });
      }

      case 'count-requests': {
        const { userId } = params;
        const result = await sql`
          SELECT COUNT(*) as count 
          FROM private_chats 
          WHERE user2 = ${userId} 
            AND accepted = false 
            AND blocked_by IS NULL
        `;
        return NextResponse.json({ data: { count: parseInt(result.rows[0].count) }, error: null });
      }

      default:
        return NextResponse.json(
          { error: { message: 'Unknown action' } },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Neon DB error:', error);
    return NextResponse.json(
      { data: null, error: { message: error.message } },
      { status: 500 }
    );
  }
}

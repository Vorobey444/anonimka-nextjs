import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper to enforce free vs pro limits
async function enforceLimits(userToken: string) {
  // get user premium
  const userRes = await sql`
    SELECT is_premium FROM users WHERE user_token = ${userToken} LIMIT 1
  `;
  const isPremium = userRes.rows[0]?.is_premium === true;

  // order photos
  const photosRes = await sql`
    SELECT id FROM user_photos WHERE user_token = ${userToken} ORDER BY position ASC, id ASC
  `;
  const ids = photosRes.rows.map((r: any) => r.id);
  if (ids.length === 0) return isPremium;

  const allowed = isPremium ? 3 : 1;

  // Activate first N photos, deactivate the rest
  for (let i = 0; i < ids.length; i++) {
    const shouldBeActive = i < allowed;
    await sql`
      UPDATE user_photos 
      SET is_active = ${shouldBeActive} 
      WHERE id = ${ids[i]} AND user_token = ${userToken}
    `;
  }

  return isPremium;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userToken = searchParams.get('userToken');
    if (!userToken) {
      return NextResponse.json({ error: { message: 'userToken required' } }, { status: 400 });
    }

    await enforceLimits(userToken);

    const photos = await sql`
      SELECT id, file_id, photo_url, caption, position, is_active, created_at, updated_at
      FROM user_photos
      WHERE user_token = ${userToken}
      ORDER BY position ASC, id ASC
    `;

    return NextResponse.json({ data: photos.rows, error: null });
  } catch (err: any) {
    console.error('[user-photos][GET] error:', err);
    return NextResponse.json({ error: { message: err?.message || 'Server error' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userToken, tgId, fileId, photoUrl, caption } = body || {};
    if (!userToken || !fileId || !photoUrl) {
      return NextResponse.json({ error: { message: 'userToken, fileId, photoUrl required' } }, { status: 400 });
    }

    // Determine next position
    const posRes = await sql`
      SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM user_photos WHERE user_token = ${userToken}
    `;
    const nextPos = posRes.rows[0]?.next_pos || 1;

    await sql`
      INSERT INTO user_photos (user_token, tg_id, file_id, photo_url, caption, position)
      VALUES (${userToken}, ${tgId || null}, ${fileId}, ${photoUrl}, ${caption || null}, ${nextPos})
    `;

    const isPremium = await enforceLimits(userToken);

    const photos = await sql`
      SELECT id, file_id, photo_url, caption, position, is_active, created_at, updated_at
      FROM user_photos
      WHERE user_token = ${userToken}
      ORDER BY position ASC, id ASC
    `;

    const activeCount = photos.rows.filter((p: any) => p.is_active).length;
    const limit = isPremium ? 3 : 1;
    const overLimit = activeCount > limit;

    return NextResponse.json({ data: photos.rows, overLimit, limit, error: null });
  } catch (err: any) {
    console.error('[user-photos][POST] error:', err);
    return NextResponse.json({ error: { message: err?.message || 'Server error' } }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userToken, order, updates } = body || {};
    if (!userToken) return NextResponse.json({ error: { message: 'userToken required' } }, { status: 400 });

    if (Array.isArray(order)) {
      // reorder
      for (let i = 0; i < order.length; i++) {
        const id = order[i];
        await sql`UPDATE user_photos SET position = ${i + 1} WHERE id = ${id} AND user_token = ${userToken}`;
      }
    }

    if (updates && Array.isArray(updates)) {
      for (const upd of updates) {
        if (!upd.id) continue;
        await sql`
          UPDATE user_photos
          SET caption = COALESCE(${upd.caption}, caption),
              is_active = COALESCE(${upd.is_active}, is_active),
              updated_at = NOW()
          WHERE id = ${upd.id} AND user_token = ${userToken}
        `;
      }
    }

    await enforceLimits(userToken);

    const photos = await sql`
      SELECT id, file_id, photo_url, caption, position, is_active, created_at, updated_at
      FROM user_photos
      WHERE user_token = ${userToken}
      ORDER BY position ASC, id ASC
    `;

    return NextResponse.json({ data: photos.rows, error: null });
  } catch (err: any) {
    console.error('[user-photos][PATCH] error:', err);
    return NextResponse.json({ error: { message: err?.message || 'Server error' } }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userToken = searchParams.get('userToken');
    if (!id || !userToken) return NextResponse.json({ error: { message: 'id and userToken required' } }, { status: 400 });

    await sql`DELETE FROM user_photos WHERE id = ${id} AND user_token = ${userToken}`;
    await enforceLimits(userToken);

    const photos = await sql`
      SELECT id, file_id, photo_url, caption, position, is_active, created_at, updated_at
      FROM user_photos
      WHERE user_token = ${userToken}
      ORDER BY position ASC, id ASC
    `;

    return NextResponse.json({ data: photos.rows, error: null });
  } catch (err: any) {
    console.error('[user-photos][DELETE] error:', err);
    return NextResponse.json({ error: { message: err?.message || 'Server error' } }, { status: 500 });
  }
}

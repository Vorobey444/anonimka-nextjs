import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

const getSql = () => neon(process.env.DATABASE_URL!);

// POST - проголосовать
export async function POST(req: NextRequest) {
  try {
    const user_token = req.headers.get('X-User-Token');
    const { poll_id, answer } = await req.json();

    if (!user_token || !poll_id || !answer) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Проверяем, не голосовал ли уже пользователь
    const sql = getSql();
    const existing = await sql`
      SELECT id FROM poll_votes
      WHERE poll_id = ${poll_id}
        AND user_token = ${user_token}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Already voted' },
        { status: 400 }
      );
    }

    // Добавляем голос
    await sql`
      INSERT INTO poll_votes (poll_id, user_token, answer)
      VALUES (${poll_id}, ${user_token}, ${answer})
    `;

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('[POLL API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to vote' },
      { status: 500 }
    );
  }
}

// GET - получить результаты
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const poll_id = searchParams.get('poll_id');
    const user_token = req.headers.get('X-User-Token');

    if (!poll_id) {
      return NextResponse.json(
        { success: false, error: 'Missing poll_id' },
        { status: 400 }
      );
    }

    // Проверяем, голосовал ли пользователь
    let hasVoted = false;
    if (user_token) {
      const sql = getSql();
      const userVote = await sql`
        SELECT id FROM poll_votes
        WHERE poll_id = ${poll_id}
          AND user_token = ${user_token}
        LIMIT 1
      `;
      hasVoted = userVote.length > 0;
    }

    // Получаем результаты
    const sql = getSql();
    const results = await sql`
      SELECT answer, COUNT(*) as count
      FROM poll_votes
      WHERE poll_id = ${poll_id}
      GROUP BY answer
    `;

    const formattedResults: { [key: string]: number } = {};
    results.forEach((row: any) => {
      formattedResults[row.answer] = parseInt(row.count);
    });

    // Если нет голосов, возвращаем 0
    if (!formattedResults.yes) formattedResults.yes = 0;
    if (!formattedResults.no) formattedResults.no = 0;

    return NextResponse.json({
      success: true,
      hasVoted: hasVoted,
      results: formattedResults
    });

  } catch (error) {
    console.error('[POLL API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get results' },
      { status: 500 }
    );
  }
}

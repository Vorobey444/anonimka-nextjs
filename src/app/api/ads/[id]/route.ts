import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE - удаление объявления по ID
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: adId } = await params;
    const id = parseInt(adId);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Неверный ID объявления" },
        { status: 400 }
      );
    }

    // Читаем данные из тела запроса
    let body: { user_token?: string; userToken?: string; tgId?: string; tg_id?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Если тело пустое - продолжаем
    }

    const userToken = body.user_token || body.userToken;
    const tgId = body.tgId || body.tg_id;

    console.log("[ADS API] Запрос на удаление объявления ID:", id, "userToken:", userToken, "tgId:", tgId);

    if (!tgId && !userToken) {
      return NextResponse.json(
        { success: false, error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    // Проверяем, что объявление принадлежит пользователю
    const checkResult = await sql`
      SELECT tg_id, user_token, created_at FROM ads WHERE id = ${id}
    `;

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Объявление не найдено" },
        { status: 404 }
      );
    }

    const ad = checkResult.rows[0];
    let isOwner = false;

    // Проверяем владение: по tgId (Telegram) или по userToken (email)
    if (tgId && ad.tg_id) {
      isOwner = Number(ad.tg_id) === Number(tgId);
    } else if (userToken && ad.user_token) {
      isOwner = ad.user_token === userToken;
    }

    if (!isOwner) {
      console.log("[ADS API] Отказано: пользователь не владелец объявления");
      return NextResponse.json(
        { success: false, error: "Вы можете удалять только свои объявления" },
        { status: 403 }
      );
    }

    // Удаляем объявление
    await sql`DELETE FROM ads WHERE id = ${id}`;

    // Если объявление было создано сегодня, уменьшаем счётчик
    try {
      const createdAt = ad.created_at;
      if (createdAt) {
        const nowUTC = new Date();
        const almatyNow = new Date(nowUTC.getTime() + 5 * 60 * 60 * 1000);
        const currentAlmatyDate = almatyNow.toISOString().split("T")[0];

        const createdUTC = new Date(createdAt);
        const createdAlmaty = new Date(createdUTC.getTime() + 5 * 60 * 60 * 1000);
        const createdAlmatyDate = createdAlmaty.toISOString().split("T")[0];

        if (createdAlmatyDate === currentAlmatyDate) {
          if (tgId && ad.tg_id) {
            await sql`
              UPDATE user_limits
              SET ads_created_today = GREATEST(0, COALESCE(ads_created_today, 0) - 1),
                  updated_at = NOW()
              WHERE user_id = ${Number(tgId)}
            `;
            console.log("[ADS API] Декремент счётчика для Telegram user:", tgId);
          } else if (userToken && ad.user_token) {
            await sql`
              UPDATE web_user_limits
              SET ads_created_today = GREATEST(0, COALESCE(ads_created_today, 0) - 1),
                  updated_at = NOW()
              WHERE user_token = ${userToken}
            `;
            console.log("[ADS API] Декремент счётчика для web user:", userToken);
          }
        }
      }
    } catch (limitError) {
      console.error("[ADS API] Ошибка обновления лимита:", limitError);
    }

    console.log("[ADS API] Объявление успешно удалено:", id);

    return NextResponse.json({
      success: true,
      message: "Объявление удалено",
    });
  } catch (error) {
    console.error("[ADS API] Ошибка при удалении:", error);
    const errorMessage = error instanceof Error ? error.message : "Ошибка при удалении объявления";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// OPTIONS для CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

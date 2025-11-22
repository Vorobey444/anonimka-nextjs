import { NextRequest, NextResponse } from 'next/server';
import { ENV } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * Прокси для защищенного просмотра фото
 * Не раскрывает прямую ссылку на Telegram API
 * Добавляет заголовки против скачивания
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const fileId = searchParams.get('fileId');
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'Missing fileId' },
        { status: 400 }
      );
    }

    const botToken = ENV.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      return NextResponse.json(
        { error: 'Bot not configured' },
        { status: 500 }
      );
    }

    // Получаем file_path
    const fileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const fileResult = await fileResponse.json();
    
    if (!fileResult.ok) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const filePath = fileResult.result.file_path;
    const photoUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    
    // Загружаем фото
    const imageResponse = await fetch(photoUrl);
    
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: 500 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Возвращаем изображение с заголовками защиты от скачивания
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline', // Показывать в браузере, не скачивать
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN', // Запрет встраивания на других сайтах
      },
    });

  } catch (error: any) {
    console.error('Secure photo error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

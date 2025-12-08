import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// Force dynamic rendering since we use request.url
export const dynamic = 'force-dynamic';

/**
 * GET /api/thumbnail?url=...&size=small
 * Генерирует оптимизированную миниатюру из полного изображения
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const size = searchParams.get('size') || 'medium';
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }

    // Размеры миниатюр
    const sizes: Record<string, number> = {
      small: 150,   // Для карточек в списке (3 фото в ряд)
      medium: 400,  // Для детального просмотра
      large: 800,   // Для fullscreen
    };

    const targetSize = sizes[size] || sizes.medium;

    // Если URL относительный, делаем его абсолютным
    let absoluteUrl: string;
    if (imageUrl.startsWith('http')) {
      absoluteUrl = imageUrl;
    } else {
      // Получаем базовый URL из request (протокол + хост)
      const requestUrl = new URL(request.url);
      const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
      absoluteUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }

    console.log('🖼️ Thumbnail request:', { imageUrl, absoluteUrl, size, targetSize });

    // Загружаем изображение
    const imageResponse = await fetch(absoluteUrl);
    if (!imageResponse.ok) {
      console.error('❌ Failed to fetch image:', imageResponse.status, imageResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch image', details: imageResponse.statusText },
        { status: 404 }
      );
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Генерируем оптимизированную миниатюру
    const optimizedBuffer = await sharp(imageBuffer)
      .resize(targetSize, targetSize, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: 80,
        effort: 4, // Баланс между скоростью и качеством
      })
      .toBuffer();

    // Возвращаем с кешированием
    return new NextResponse(optimizedBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable', // 1 год
        'Content-Length': optimizedBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('❌ Thumbnail generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

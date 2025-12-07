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

    // Загружаем изображение
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

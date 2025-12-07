import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ENV } from '@/lib/env';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for env vars

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const photo = formData.get('photo') as File;
    const userId = formData.get('userId') as string;
    
    if (!photo) {
      return NextResponse.json(
        { error: { message: 'No photo provided' } },
        { status: 400 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: { message: 'User ID required' } },
        { status: 400 }
      );
    }
    
    const botToken = ENV.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      return NextResponse.json(
        { error: { message: 'Telegram bot not configured' } },
        { status: 500 }
      );
    }
    
    // Получаем tg_id пользователя (userId может быть токеном)
    const isToken = userId && typeof userId === 'string' && userId.length > 20;
    let telegramUserId: string | null = null;
    
    if (isToken) {
      // Ищем tg_id по токену
      const userInfo = await sql`
        SELECT tg_id FROM ads WHERE user_token = ${userId} ORDER BY created_at DESC LIMIT 1
      `;
      if (userInfo.rows.length > 0 && userInfo.rows[0].tg_id) {
        telegramUserId = userInfo.rows[0].tg_id.toString();
      }
    } else {
      telegramUserId = userId;
    }
    
    if (!telegramUserId) {
      console.log('⚠️ Web-only user detected, using token as identifier');
      // Для web-only пользователей используем токен вместо tg_id
      telegramUserId = userId.substring(0, 12); // Укороченный токен для подписи
    }
    
    // Конвертируем File в Buffer
    let buffer: Buffer = Buffer.from(await photo.arrayBuffer());
    
    // Определяем тип медиа (фото или видео)
    const isVideo = photo.type.startsWith('video/');
    const isHeic = photo.type.includes('heic') || photo.type.includes('heif');
    
    // Удаляем EXIF метаданные из фото (для видео и HEIC не применяется)
    // HEIC может обрабатывать сам Telegram, Sharp не поддерживает HEIC на Vercel
    if (!isVideo && !isHeic && photo.type.startsWith('image/')) {
      console.log('🧹 Обработка изображения...');
      const originalSize = buffer.length;
      try {
        const cleanedBuffer = await sharp(buffer)
          .rotate() // Автоповорот по EXIF (если есть), затем удаление
          .jpeg({ quality: 85 }) // Конвертируем в JPEG без метаданных
          .toBuffer();
        buffer = Buffer.from(cleanedBuffer);
        console.log(`✅ Изображение обработано (${originalSize} → ${buffer.length} bytes)`);
      } catch (error) {
        console.warn('⚠️ Не удалось обработать изображение, отправляем оригинал:', error);
        // Продолжаем с оригинальным буфером
      }
    } else if (isHeic) {
      console.log('ℹ️ HEIC формат - отправляем оригинал (Telegram поддерживает HEIC)');
    }
    
    console.log('📤 Загрузка медиа через Telegram Bot API:', {
      userId: userId.substring(0, 10) + '...',
      tg_id: telegramUserId,
      mediaSize: buffer.length,
      mediaType: photo.type,
      exifRemoved: !isVideo && photo.type.startsWith('image/')
    });
    
    // РЕШЕНИЕ: Используем служебный канал для хранения фото
    // ID канала берётся из ENV конфига (с fallback на hardcoded значение)
    const storageChannel = ENV.TELEGRAM_STORAGE_CHANNEL;
    
    console.log('🔍 Storage channel:', {
      value: storageChannel.substring(0, 10) + '...',
      fromEnv: !!process.env.TELEGRAM_STORAGE_CHANNEL
    });
    
    const endpoint = isVideo ? 'sendVideo' : 'sendPhoto';
    const fieldName = isVideo ? 'video' : 'photo';
    
    const telegramFormData = new FormData();
    telegramFormData.append('chat_id', storageChannel); // Отправляем в канал-хранилище
    // Создаем Blob из buffer
    const blob = new Blob([buffer as any], { type: isVideo ? 'video/mp4' : 'image/jpeg' });
    telegramFormData.append(fieldName, blob, isVideo ? 'video.mp4' : 'photo.jpg');
    telegramFormData.append('caption', `${isVideo ? '🎥' : '📸'} User: ${telegramUserId} (EXIF stripped)`);
    
    // Отправляем медиа в канал-хранилище
    const response = await fetch(`https://api.telegram.org/bot${botToken}/${endpoint}`, {
      method: 'POST',
      body: telegramFormData
    });
    
    const result = await response.json();
    
    if (!result.ok) {
      console.error('❌ Telegram API error:', result);
      return NextResponse.json(
        { error: { message: result.description || 'Failed to upload media' } },
        { status: 500 }
      );
    }
    
    console.log(`✅ ${isVideo ? 'Видео' : 'Фото'} загружено в канал-хранилище`);
    
    // Получаем file_id и URL
    let fileId, fileData;
    
    if (isVideo) {
      fileData = result.result.video;
      fileId = fileData.file_id;
    } else {
      const photoArray = result.result.photo;
      fileData = photoArray[photoArray.length - 1]; // Берём самое большое фото
      fileId = fileData.file_id;
    }
    
    // Используем защищенный URL через наш прокси (без раскрытия Telegram API)
    const securePhotoUrl = `/api/secure-photo?fileId=${encodeURIComponent(fileId)}`;
    
    console.log(`✅ ${isVideo ? 'Video' : 'Photo'} uploaded, file_id:`, fileId);
    
    return NextResponse.json({
      data: {
        file_id: fileId,
        photo_url: securePhotoUrl, // Защищенный URL через прокси
        is_video: isVideo
      },
      error: null
    });
    
  } catch (error: any) {
    console.error('❌ Upload photo error:', error);
    return NextResponse.json(
      { error: { message: error.message || 'Unknown error' } },
      { status: 500 }
    );
  }
}

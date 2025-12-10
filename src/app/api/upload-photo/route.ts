import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import sharp from 'sharp';
import { ENV } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // Лимит 60 секунд вместо 300

// Утилита для таймаута промисов
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), ms)
    )
  ]);
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
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
    let mimeType = photo.type || 'application/octet-stream';
    let fileName = photo.name;
    
    // Определяем тип медиа (фото или видео)
    let isVideo = mimeType.startsWith('video/');

    // Fallback: конвертация HEIC/HEIF → JPEG сервер-сайд, если клиент не сконвертировал
    const lowerName = (fileName || '').toLowerCase();
    const isHeic = mimeType === 'image/heic' || mimeType === 'image/heif' || lowerName.endsWith('.heic') || lowerName.endsWith('.heif');
    
    // Лимит размера для серверной конвертации (5MB)
    const MAX_HEIC_SIZE = 5 * 1024 * 1024;
    
    if (isHeic) {
      // Проверяем размер — слишком большие файлы отклоняем
      if (buffer.length > MAX_HEIC_SIZE) {
        console.error('❌ HEIC файл слишком большой:', buffer.length);
        return NextResponse.json(
          { error: { message: 'Файл слишком большой. Максимум 5MB для HEIC. Сконвертируйте в JPG или сожмите.' } },
          { status: 413 }
        );
      }
      
      const targetName = lowerName ? lowerName.replace(/\.(heic|heif)$/i, '.jpg') : 'photo.jpg';
      let converted = false;
      
      // Пробуем sharp с таймаутом 15 секунд
      try {
        const sharpPromise = sharp(buffer).rotate().jpeg({ quality: 92 }).toBuffer();
        const convertedBuf = await withTimeout(sharpPromise, 15000, 'Sharp HEIC timeout');
        buffer = convertedBuf;
        mimeType = 'image/jpeg';
        fileName = targetName;
        isVideo = false;
        converted = true;
        console.log('🔄 HEIC/HEIF converted to JPEG on server (sharp)', { size: buffer.length, time: Date.now() - startTime });
      } catch (heicErr: any) {
        console.warn('⚠️ sharp HEIC convert failed:', heicErr?.message || heicErr);
      }

      // Fallback: heic-convert с таймаутом 30 секунд
      if (!converted) {
        try {
          const heicConvert = (await import('heic-convert')).default;
          const heicPromise = heicConvert({ buffer, format: 'JPEG', quality: 0.92 });
          const output = await withTimeout(heicPromise, 30000, 'HEIC convert timeout');
          buffer = Buffer.from(output);
          mimeType = 'image/jpeg';
          fileName = targetName;
          isVideo = false;
          converted = true;
          console.log('🔄 HEIC/HEIF converted via heic-convert fallback', { size: buffer.length, time: Date.now() - startTime });
        } catch (fallbackErr: any) {
          console.error('❌ HEIC→JPEG convert failed:', fallbackErr?.message || fallbackErr);
          return NextResponse.json(
            { error: { message: 'Не удалось обработать HEIC. Попробуйте сконвертировать в JPG на устройстве.' } },
            { status: 415 }
          );
        }
      }
    }
    
    console.log('📤 Отправка оригинального файла в Telegram:', {
      userId: userId.substring(0, 10) + '...',
      tg_id: telegramUserId,
      size: buffer.length,
      type: mimeType,
      name: fileName
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
    telegramFormData.append('chat_id', storageChannel);
    // Отправляем оригинальный файл - Telegram сам обработает формат
    const blob = new Blob([buffer as any], { type: mimeType });
    telegramFormData.append(fieldName, blob, fileName || (isVideo ? 'video.mp4' : 'photo.jpg'));
    telegramFormData.append('caption', `${isVideo ? '🎥' : '📸'} User: ${telegramUserId}`);
    
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

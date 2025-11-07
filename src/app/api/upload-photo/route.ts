import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

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
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
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
      console.log('⚠️ Uploading photo without sending to Telegram (no tg_id found)');
      // Для web-only пользователей: просто сохраняем файл локально
      // TODO: implement file storage (e.g., Vercel Blob, AWS S3)
      return NextResponse.json(
        { error: { message: 'Photo upload for web-only users not yet implemented' } },
        { status: 501 }
      );
    }
    
    // Конвертируем File в Buffer
    const buffer = Buffer.from(await photo.arrayBuffer());
    
    // Создаём FormData для Telegram API
    const telegramFormData = new FormData();
    telegramFormData.append('chat_id', telegramUserId);
    telegramFormData.append('photo', new Blob([buffer]), 'photo.jpg');
    telegramFormData.append('caption', '📸 Фото через Anonimka');
    
    console.log('📤 Загрузка фото в Telegram:', {
      userId: userId.substring(0, 10) + '...',
      tg_id: telegramUserId,
      photoSize: buffer.length,
      photoType: photo.type
    });
    
    // Отправляем фото через Telegram Bot API
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      body: telegramFormData
    });
    
    const result = await response.json();
    
    if (!result.ok) {
      console.error('❌ Telegram API error:', result);
      return NextResponse.json(
        { error: { message: result.description || 'Failed to upload photo to Telegram' } },
        { status: 500 }
      );
    }
    
    console.log('✅ Фото загружено в Telegram:', result);
    
    // Получаем file_id и URL фото
    const photoData = result.result.photo[result.result.photo.length - 1]; // Берём самое большое фото
    const fileId = photoData.file_id;
    
    // Получаем file_path для построения URL
    const fileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const fileResult = await fileResponse.json();
    
    if (!fileResult.ok) {
      console.error('❌ Failed to get file path:', fileResult);
      return NextResponse.json(
        { error: { message: 'Failed to get file path' } },
        { status: 500 }
      );
    }
    
    const filePath = fileResult.result.file_path;
    const photoUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    
    console.log('✅ Photo URL:', photoUrl);
    
    return NextResponse.json({
      data: {
        file_id: fileId,
        photo_url: photoUrl
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

import { NextRequest, NextResponse } from 'next/server';

// Supabase клиент на сервере
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vcxknlntcvcdowdohblr.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeGtubG50Y3ZjZG93ZG9oYmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1NDk3NjMsImV4cCI6MjA0NjEyNTc2M30.TcBhgBh9DQ5PzbcSl2eWxHxJBwBVnlv_JmR9Bfin-P8';

async function supabaseRequest(url: string, options: RequestInit = {}) {
  try {
    const fullUrl = `${SUPABASE_URL}${url}`;
    console.log('📡 Supabase request URL:', fullUrl);
    console.log('📡 Headers:', {
      apikey: SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      url: SUPABASE_URL
    });
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(fullUrl, {
      ...options,
      signal: controller.signal,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...options.headers
      }
    });

    clearTimeout(timeout);

    console.log('📡 Supabase response status:', response.status);
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Non-JSON response:', text);
      return { error: { message: 'Invalid response format', details: text } };
    }

    const data = await response.json();
    console.log('📡 Supabase response data:', data);
    
    if (!response.ok) {
      console.error('❌ Supabase error:', data);
      return { error: data };
    }
    
    return data;
  } catch (error: any) {
    console.error('❌ Supabase request exception:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    return { error: { message: error.message || 'Request failed', name: error.name } };
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('=== /api/chats GET request ===');
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    
    console.log('Parameters:', { userId, action });

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId обязателен' },
        { status: 400 }
      );
    }

    // Подсчет непринятых запросов
    if (action === 'count-requests') {
      console.log('Counting requests for user:', userId);
      const response = await supabaseRequest(
        `/rest/v1/private_chats?select=id&user2=eq.${userId}&accepted=eq.false&blocked_by=is.null`
      );

      if (response.error) {
        console.error('Ошибка подсчета запросов:', response.error);
        return NextResponse.json(
          { success: false, error: response.error.message || 'Unknown error' },
          { status: 500 }
        );
      }

      const count = Array.isArray(response) ? response.length : 0;
      console.log('Requests count:', count);
      
      return NextResponse.json({
        success: true,
        count
      });
    }

    // Получение активных чатов
    if (action === 'get-active') {
      console.log('Getting active chats for user:', userId);
      const response = await supabaseRequest(
        `/rest/v1/private_chats?select=*&or=(user1.eq.${userId},user2.eq.${userId})&accepted=eq.true&blocked_by=is.null&order=last_message_at.desc`
      );

      if (response.error) {
        console.error('Ошибка получения активных чатов:', response.error);
        return NextResponse.json(
          { success: false, error: response.error.message || 'Unknown error' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        chats: Array.isArray(response) ? response : []
      });
    }

    // Получение входящих запросов
    if (action === 'get-requests') {
      const response = await supabaseRequest(
        `/rest/v1/private_chats?select=*&user2=eq.${userId}&accepted=eq.false&blocked_by=is.null&order=created_at.desc`
      );

      if (response.error) {
        console.error('Ошибка получения запросов:', response.error);
        return NextResponse.json(
          { success: false, error: response.error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        requests: Array.isArray(response) ? response : []
      });
    }

    // Получение информации о конкретном чате
    if (action === 'get-chat') {
      const chatId = searchParams.get('chatId');
      if (!chatId) {
        return NextResponse.json(
          { success: false, error: 'chatId обязателен' },
          { status: 400 }
        );
      }

      const response = await supabaseRequest(
        `/rest/v1/private_chats?select=*&id=eq.${chatId}`
      );

      if (response.error) {
        console.error('Ошибка получения чата:', response.error);
        return NextResponse.json(
          { success: false, error: response.error.message },
          { status: 500 }
        );
      }

      const chat = Array.isArray(response) ? response[0] : response;
      if (!chat) {
        return NextResponse.json(
          { success: false, error: 'Чат не найден' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        chat
      });
    }

    return NextResponse.json(
      { success: false, error: 'Неизвестное действие' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Критическая ошибка в /api/chats:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// PATCH - принять/отклонить запрос или обновить чат
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId, userId, action, ...updateData } = body;

    if (!chatId || !userId) {
      return NextResponse.json(
        { success: false, error: 'chatId и userId обязательны' },
        { status: 400 }
      );
    }

    // Принять запрос
    if (action === 'accept') {
      const response = await supabaseRequest(
        `/rest/v1/private_chats?id=eq.${chatId}&user2=eq.${userId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ accepted: true }),
          headers: { 'Prefer': 'return=representation' }
        }
      );

      if (response.error) {
        console.error('Ошибка принятия запроса:', response.error);
        return NextResponse.json(
          { success: false, error: response.error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        chat: Array.isArray(response) ? response[0] : response
      });
    }

    // Отклонить/удалить запрос
    if (action === 'reject') {
      const response = await supabaseRequest(
        `/rest/v1/private_chats?id=eq.${chatId}&user2=eq.${userId}`,
        { method: 'DELETE' }
      );

      if (response.error) {
        console.error('Ошибка отклонения запроса:', response.error);
        return NextResponse.json(
          { success: false, error: response.error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true
      });
    }

    // Обновить последнее сообщение
    if (action === 'update-last-message') {
      const response = await supabaseRequest(
        `/rest/v1/private_chats?id=eq.${chatId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateData),
          headers: { 'Prefer': 'return=representation' }
        }
      );

      if (response.error) {
        console.error('Ошибка обновления чата:', response.error);
        return NextResponse.json(
          { success: false, error: response.error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        chat: Array.isArray(response) ? response[0] : response
      });
    }

    return NextResponse.json(
      { success: false, error: 'Неизвестное действие' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Критическая ошибка в PATCH /api/chats:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

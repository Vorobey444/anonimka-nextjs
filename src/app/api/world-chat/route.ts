import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'get-messages') {
      // Проксируем запрос на бэкенд для получения сообщений
      const response = await fetch(`${API_URL}/api/world-chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: 'Backend service unavailable' },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
      
    } else if (action === 'send-message') {
      // Проксируем запрос на бэкенд для отправки сообщения
      const response = await fetch(`${API_URL}/api/world-chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: 'Backend service unavailable' },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
      
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('World chat API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

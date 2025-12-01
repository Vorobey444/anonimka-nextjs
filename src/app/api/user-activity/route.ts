import { NextRequest, NextResponse } from 'next/server';
import { safeLog } from '@/utils/safeLogger';

export const dynamic = 'force-dynamic';

// Хранилище активных пользователей в памяти
// Формат: { userId: { chatId, lastSeen: timestamp } }
const activeUsers = new Map<string, { chatId: number; lastSeen: number }>();

// Таймаут активности: 30 секунд
const ACTIVITY_TIMEOUT = 30000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    if (!params) {
      return NextResponse.json(
        { data: null, error: { message: 'Missing params' } },
        { status: 400 }
      );
    }

    switch (action) {
      // Пометить пользователя как активного в чате
      case 'mark-active': {
        const { userId, chatId } = params;
        
        if (!userId || !chatId) {
          return NextResponse.json(
            { data: null, error: { message: 'Missing userId or chatId' } },
            { status: 400 }
          );
        }
        
        activeUsers.set(userId.toString(), {
          chatId: parseInt(chatId),
          lastSeen: Date.now()
        });
        
        safeLog('👤 Пользователь активен', { userId, chatId, activeCount: activeUsers.size });
        
        return NextResponse.json({ 
          data: { active: true, timestamp: Date.now() }, 
          error: null 
        });
      }

      // Проверить активен ли пользователь в чате
      case 'is-active': {
        const { userId, chatId } = params;
        
        if (!userId || !chatId) {
          return NextResponse.json(
            { data: null, error: { message: 'Missing userId or chatId' } },
            { status: 400 }
          );
        }
        
        const userActivity = activeUsers.get(userId.toString());
        
        if (!userActivity) {
          return NextResponse.json({ 
            data: { active: false, reason: 'not_found' }, 
            error: null 
          });
        }

        const isRecent = (Date.now() - userActivity.lastSeen) < ACTIVITY_TIMEOUT;
        const isInChat = userActivity.chatId === parseInt(chatId);
        const active = isRecent && isInChat;

        // Очищаем неактивных пользователей
        if (!isRecent) {
          activeUsers.delete(userId.toString());
        }

        console.log('🔍 Проверка активности:', { 
          userId, 
          chatId, 
          active, 
          isRecent,
          isInChat,
          lastSeen: userActivity.lastSeen 
        });

        return NextResponse.json({ 
          data: { 
            active, 
            lastSeen: userActivity.lastSeen,
            isRecent,
            isInChat
          }, 
          error: null 
        });
      }

      // Пометить пользователя как неактивного
      case 'mark-inactive': {
        const { userId } = params;
        
        if (!userId) {
          return NextResponse.json(
            { data: null, error: { message: 'Missing userId' } },
            { status: 400 }
          );
        }
        
        const removed = activeUsers.delete(userId.toString());
        
        safeLog('👋 Пользователь неактивен', { userId, removed });
        
        return NextResponse.json({ 
          data: { inactive: true, removed }, 
          error: null 
        });
      }

      // Получить всех активных пользователей (для отладки)
      case 'get-active-users': {
        const now = Date.now();
        const active = Array.from(activeUsers.entries())
          .filter(([_, data]) => (now - data.lastSeen) < ACTIVITY_TIMEOUT)
          .map(([userId, data]) => ({
            userId,
            chatId: data.chatId,
            lastSeen: data.lastSeen,
            secondsAgo: Math.floor((now - data.lastSeen) / 1000)
          }));

        return NextResponse.json({ 
          data: { users: active, count: active.length }, 
          error: null 
        });
      }

      default:
        return NextResponse.json(
          { data: null, error: { message: 'Unknown action' } },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[USER-ACTIVITY] API Error:', error);
    console.error('[USER-ACTIVITY] Stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { data: null, error: { message: 'Server error', details: String(error) } },
      { status: 500 }
    );
  }
}

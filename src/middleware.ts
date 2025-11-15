import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Middleware выполняется перед каждым запросом
  // Здесь можно добавить логирование запросов если нужно
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

// Глобальный обработчик необработанных ошибок
if (typeof process !== 'undefined') {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    
    // Отправляем в Telegram через serverErrorLogger
    if (process.env.NODE_ENV === 'production') {
      import('./lib/serverErrorLogger').then(({ ServerErrorLogger }) => {
        ServerErrorLogger.logError(
          new Error(`Unhandled Rejection: ${reason}`),
          { endpoint: 'unhandledRejection' }
        );
      });
    }
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    
    if (process.env.NODE_ENV === 'production') {
      import('./lib/serverErrorLogger').then(({ ServerErrorLogger }) => {
        ServerErrorLogger.logError(error, { endpoint: 'uncaughtException' });
      });
    }
  });
}

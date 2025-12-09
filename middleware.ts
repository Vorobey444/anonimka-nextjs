import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = [
  '/main',
  '/create',
  '/browse',
  '/my-ads',
  '/chats',
  '/location-setup',
  '/contacts',
  '/rules',
  '/about',
  '/privacy'
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Проверяем, является ли маршрут защищенным
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isProtectedRoute) {
    // Проверяем наличие токена в куке или localStorage
    const token = request.cookies.get('user_token')?.value;
    
    if (!token) {
      // Перенаправляем на главную страницу если нет токена
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/:path*',
  ],
};


import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('auth')
  const { pathname } = request.nextUrl

  // Rutas protegidas que requieren autenticación
  const protectedPaths = ['/workshop', '/inicio', '/unit-planner',"/comunidad","/ranking","/pricing"]
  
  // Rutas públicas de autenticación
  const authPaths = ['/sign-in', '/sign-up', '/forgot-password']

  // Si el usuario no está autenticado y trata de acceder a una ruta protegida
  if (!authCookie && protectedPaths.some(path => pathname.startsWith(path)) && !pathname.includes('/unit-planner/shared/')) {
    const response = NextResponse.redirect(new URL('/sign-in', request.url))
    // Limpiar la cookie de autenticación si existe
    response.cookies.delete('auth')
    return response
  }

  // Si el usuario está autenticado y trata de acceder a una ruta de autenticación
  if (authCookie && authPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/unit-planner', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 
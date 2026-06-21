import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next 16 Proxy (ehemals middleware).
 * Aktualisiert bei jeder Anfrage die Supabase-Session (Token-Refresh) und
 * leitet nicht-authentifizierte Nutzer auf geschützten Routen zu /login um.
 *
 * Wichtig: Immer das `response`-Objekt mit den gesetzten Cookies zurückgeben,
 * sonst geht die aufgefrischte Session verloren.
 */

// Öffentlich erreichbare Pfade (kein Login nötig)
const PUBLIC_PATHS = ['/login', '/auth', '/mfa']

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // WICHTIG: getUser() validiert das Token serverseitig (nicht nur getSession()).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Alle Pfade außer:
     * - api (Route Handler – eigene Auth-Prüfung)
     * - _next/static, _next/image (Build-Assets)
     * - favicon.ico, robots.txt, sitemap.xml und Bilddateien
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}

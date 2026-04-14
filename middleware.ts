import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Refrescar sesión
  const response = await updateSession(request)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // --- REGLAS DE ACCESO ---

  // A. EXCEPCIONES: Permitir siempre el checkout y la raíz
  if (pathname === '/checkout' || pathname === '/') {
    return response
  }

  // B. PROTECCIÓN DASHBOARD
  if (pathname.startsWith('/dashboard')) {
    // Si no está logueado, mandarlo al inicio (evita 404 de /login)
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Revisar suscripción
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at')
      .eq('id', user.id)
      .single()

    if (profile) {
      const now = new Date()
      const trialEnd = new Date(profile.trial_ends_at)
      
      // Si expiró y no es activo, forzar checkout
      if (now > trialEnd && profile.subscription_status !== 'active') {
        const url = request.nextUrl.clone()
        url.pathname = '/checkout'
        return NextResponse.redirect(url)
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

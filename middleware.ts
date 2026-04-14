import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Refrescar la sesión (mantiene al usuario logueado)
  const response = await updateSession(request)

  // 2. Cliente de Supabase para verificar estado en la DB
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

  // A. EXCEPCIONES: No bloquear estas rutas nunca
  if (pathname === '/checkout' || pathname === '/' || pathname.startsWith('/auth')) {
    return response
  }

  // B. PROTECCIÓN DEL DASHBOARD
  if (pathname.startsWith('/dashboard')) {
    // Si no hay usuario, mandar al login real
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Verificar suscripción en la tabla profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at')
      .eq('id', user.id)
      .single()

    if (profile) {
      const isExpired = new Date() > new Date(profile.trial_ends_at)
      const isNotActive = profile.subscription_status !== 'active'

      // Si venció y no ha pagado, mandar a checkout
      if (isExpired && isNotActive) {
        return NextResponse.redirect(new URL('/checkout', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

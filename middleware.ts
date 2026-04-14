import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Refrescar la sesión
  const response = await updateSession(request)

  // 2. Cliente de Supabase
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

  // A. EXCEPCIONES: Rutas que NUNCA deben bloquearse
  if (pathname === '/checkout' || pathname === '/' || pathname.startsWith('/auth')) {
    return response
  }

  // B. PROTECCIÓN DEL DASHBOARD
  if (pathname.startsWith('/dashboard')) {
    // Si no está logueado, mandarlo a tu ruta real: /auth/login
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Verificar suscripción
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at')
      .eq('id', user.id)
      .single()

    if (profile) {
      const isExpired = new Date() > new Date(profile.trial_ends_at)
      const isNotActive = profile.subscription_status !== 'active'

      // Si venció y no ha pagado, mandarlo al checkout
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

import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Ejecutamos tu lógica original de sesión
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

  // 2. CORRECCIÓN DE RUTA (Para eliminar el 404 definitivamente)
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // 3. LÓGICA DE SUSCRIPCIÓN
  if (user && pathname.startsWith('/dashboard')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at')
      .eq('id', user.id)
      .single()

    if (profile) {
      const isExpired = new Date() > new Date(profile.trial_ends_at)
      const isNotActive = profile.subscription_status !== 'active'

      // Si el tiempo de prueba venció, lo mandamos al checkout
      if (isExpired && isNotActive) {
        return NextResponse.redirect(new URL('/checkout', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Primero ejecutamos la actualización de sesión normal
  const response = await updateSession(request)

  // 2. Creamos un cliente de Supabase para leer el perfil
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

  // 3. Lógica de restricción
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at')
      .eq('id', user.id)
      .single()

    if (profile) {
      const now = new Date()
      const trialEnd = new Date(profile.trial_ends_at)
      const isExpired = now > trialEnd
      const isActive = profile.subscription_status === 'active'

      // Si expiró y no es activo, y NO está ya en la página de pago, redirigir
      // Evitamos el bucle infinito permitiendo el acceso a /checkout y a la API de Wompi
      const isAuthPage = request.nextUrl.pathname.startsWith('/checkout') || 
                         request.nextUrl.pathname.startsWith('/api/wompi')

      if (isExpired && !isActive && !isAuthPage) {
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

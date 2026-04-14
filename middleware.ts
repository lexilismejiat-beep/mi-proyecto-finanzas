import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Mantenemos tu lógica original de refrescar sesión
  const response = await updateSession(request)

  // 2. Creamos el cliente para verificar la base de datos
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

  // --- REGLAS DE TRÁFICO ---

  // A. Si intentan entrar a /login (el que da 404), los mandamos al correcto
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // B. Protección del Dashboard
  if (pathname.startsWith('/dashboard')) {
    // Si no hay usuario logueado
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Traer el perfil para ver si ya pagó
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at')
      .eq('id', user.id)
      .single()

    if (profile) {
      const isExpired = new Date() > new Date(profile.trial_ends_at)
      const isNotActive = profile.subscription_status !== 'active'

      // C. Si expiró y no es activo, directos al checkout
      if (isExpired && isNotActive) {
        return NextResponse.redirect(new URL('/checkout', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Usamos tu matcher original para no romper nada
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

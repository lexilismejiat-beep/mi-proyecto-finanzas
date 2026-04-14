import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Refresca la sesión para mantener al usuario logueado
  // Pasamos la request original para que updateSession maneje las cookies
  const response = await updateSession(request)

  // 2. Creamos cliente de Supabase para leer la base de datos
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
        },
      },
    }
  )

  // Obtenemos al usuario de forma segura
  const { data: { user } } = await supabase.auth.getUser()

  // 3. DEFINICIÓN DE RUTAS
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const isCheckoutPage = request.nextUrl.pathname.startsWith('/checkout')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')

  // 4. LÓGICA DE BLOQUEO
  // Solo verificamos si el usuario intenta entrar a una zona protegida (Dashboard)
  if (user && isDashboard) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at')
      .eq('id', user.id)
      .single()

    if (profile) {
      const now = new Date()
      const trialEnd = new Date(profile.trial_ends_at)
      
      const isExpired = now > trialEnd
      const isNotActive = profile.subscription_status !== 'active'

      // Si expiró el tiempo y no ha pagado...
      if (isExpired && isNotActive) {
        // Redirigimos dinámicamente a /checkout usando la URL actual para no fallar en dominios de Vercel
        const url = request.nextUrl.clone()
        url.pathname = '/checkout'
        return NextResponse.redirect(url)
      }
    }
  }

  // 5. PROTECCIÓN BÁSICA: Si no hay usuario y trata de entrar al dashboard, al login
  if (!user && isDashboard) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
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

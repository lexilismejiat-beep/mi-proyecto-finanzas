import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Refresca la sesión (tu código original)
  const response = await updateSession(request)

  // 2. Creamos cliente para hablar con Supabase
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

  // 3. Si el usuario está en el Dashboard, revisamos su pago
  if (user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at')
      .eq('id', user.id)
      .single()

    if (profile) {
      const now = new Date()
      const trialEnd = new Date(profile.trial_ends_at)
      
      // Si el tiempo se acabó y no ha pagado...
      if (now > trialEnd && profile.subscription_status !== 'active') {
        // ...lo mandamos a la página de pago
        return NextResponse.redirect(new URL('/checkout', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*'], // Solo vigilamos el dashboard
}

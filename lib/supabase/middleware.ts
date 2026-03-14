import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public paths that don't require authentication
  const publicPaths = ['/auth/login', '/auth/callback', '/auth/error']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // If user is not logged in and trying to access protected routes
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in, check if registration is complete
  if (user && !isPublicPath && pathname !== '/registro') {
    // Check if profile is complete
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('registration_complete')
      .eq('id', user.id)
      .single()

    // If registration is not complete, redirect to registration
    if (!profile?.registration_complete) {
      const url = request.nextUrl.clone()
      url.pathname = '/registro'
      return NextResponse.redirect(url)
    }
  }

  // If user is logged in and on login page, redirect to dashboard
  if (user && pathname === '/auth/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

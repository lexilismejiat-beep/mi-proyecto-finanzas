// 1. Forzamos a Next.js a tratar esto como estático para que el Build de la APK pase.
export const dynamic = 'force-static'
export const revalidate = false

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // En una exportación estática para APK, origin puede ser indefinido,
  // así que añadimos un fallback por seguridad.
  const { searchParams, origin } = new URL(request.url)
  const baseUrl = origin || "http://localhost:3000"
  
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/registro"

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("registration_complete")
            .eq("id", user.id)
            .single()
          
          if (profile?.registration_complete) {
            return NextResponse.redirect(`${baseUrl}/dashboard`)
          }
          return NextResponse.redirect(`${baseUrl}/registro`)
        }
      }
    } catch (e) {
      console.error("Error en el intercambio de código:", e)
    }
  }

  // Si algo falla, redirigimos a una página de error estática
  return NextResponse.redirect(`${baseUrl}/auth/error`)
}

// 2. Necesitamos esta función para que Next.js sepa que esta ruta "existe" en el export
export async function generateStaticParams() {
  return []
}

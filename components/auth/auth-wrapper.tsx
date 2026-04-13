"use client"

import { useEffect, useState, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { ThemeSettingsProvider, useThemeSettings } from "@/lib/theme-context"
import { ThemeCustomizer } from "@/components/dashboard/theme-customizer"

interface UserProfile {
  id: string
  nombres: string
  apellidos: string
  cedula: string
  telefono: string
  registration_complete: boolean
  avatar_url: string | null
}

export function AuthWrapper({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const publicPaths = ["/auth/login", "/auth/callback", "/auth/error"]

  useEffect(() => {
    // 1. Verificar sesión actual
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else if (!publicPaths.includes(pathname)) {
        router.push("/auth/login")
      }
      setIsLoading(false)
    }
    
    initAuth()

    // 2. ESCUCHA ACTIVA: Esto es lo que desbloquea el APK al volver de Google
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user)
        await fetchProfile(session.user.id)
        setIsLoading(false) // CRÍTICO: Apaga el cargando al recibir la sesión
      } else {
        setUser(null)
        setProfile(null)
        if (!publicPaths.includes(pathname)) {
          router.push("/auth/login")
        }
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [pathname])

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase.from("user_profiles").select("*").eq("id", userId).single()
      setProfile(data)
      if (data && !data.registration_complete && pathname !== "/registro") {
        router.push("/registro")
      }
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Sincronizando sesión...</p>
        </div>
      </div>
    )
  }

  if (publicPaths.includes(pathname) || pathname === "/registro") return <>{children}</>

  return (
    <ThemeSettingsProvider>
      <ThemedContent user={user} profile={profile}>{children}</ThemedContent>
    </ThemeSettingsProvider>
  )
}

function ThemedContent({ children, user, profile }: any) {
  const { theme } = useThemeSettings()
  return (
    <div className="min-h-screen relative" style={{ backgroundColor: theme.background_color, color: theme.text_color }}>
      <div className="relative z-10">{children}</div>
      <ThemeCustomizer />
    </div>
  )
}

"use client"

import { useEffect, useState, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { ThemeSettingsProvider, useThemeSettings } from "@/lib/theme-context"
import { ThemeCustomizer } from "@/components/dashboard/theme-customizer"

interface UserProfile {
  id: string
  registration_complete: boolean
  subscription_status?: string
  trial_ends_at?: string
}

export function AuthWrapper({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const publicPaths = ["/auth/login", "/auth/callback", "/auth/error", "/checkout", "/"]

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        if (!publicPaths.includes(pathname)) {
          router.push("/auth/login")
        }
        setIsLoading(false)
      }
    })

    checkAuth()
    return () => subscription.unsubscribe()
  }, [pathname])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      if (!publicPaths.includes(pathname)) router.push("/auth/login")
      setIsLoading(false)
      return
    }
    setUser(user)
    await fetchProfile(user.id)
  }

  const fetchProfile = async (userId: string) => {
    try {
      // 1. Buscamos en 'user_profiles' que es donde suele estar el flag de registro
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("id, registration_complete")
        .eq("id", userId)
        .single()

      // 2. Buscamos en 'profiles' los datos de suscripción (según tu captura de Supabase)
      const { data: subData } = await supabase
        .from("profiles")
        .select("subscription_status, trial_ends_at")
        .eq("id", userId)
        .single()

      const fullProfile = { ...profileData, ...subData }
      setProfile(fullProfile)

      if (fullProfile) {
        // Lógica de Suscripción
        const isExpired = fullProfile.trial_ends_at ? (new Date() > new Date(fullProfile.trial_ends_at)) : false
        const isNotActive = fullProfile.subscription_status !== 'active'

        if (fullProfile.registration_complete && isExpired && isNotActive && pathname.startsWith('/dashboard')) {
          router.push("/checkout")
          return
        }

        // Lógica de Registro (Si ya está completo, mandarlo al dashboard)
        if (!fullProfile.registration_complete && pathname !== "/registro") {
          router.push("/registro")
        } else if (fullProfile.registration_complete && (pathname === "/registro" || pathname === "/")) {
          router.push("/dashboard")
        }
      }
    } catch (error) {
      console.error("Error cargando perfil:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (publicPaths.includes(pathname) || pathname === "/registro") {
    return <>{children}</>
  }

  return (
    <ThemeSettingsProvider>
      <ThemedContent user={user} profile={profile}>{children}</ThemedContent>
    </ThemeSettingsProvider>
  )
}

function ThemedContent({ children, user, profile }: { children: ReactNode, user: User | null, profile: UserProfile | null }) {
  const { theme } = useThemeSettings()
  return (
    <div className="min-h-screen relative" style={{ backgroundColor: theme.background_color, color: theme.text_color }}>
      {theme.background_image_url && (
        <div className="fixed inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${theme.background_image_url})`, opacity: theme.background_opacity / 100 }} />
      )}
      <div className="relative z-10">{children}</div>
      <ThemeCustomizer />
    </div>
  )
}

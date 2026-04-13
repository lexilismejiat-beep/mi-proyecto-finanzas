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

interface AuthWrapperProps {
  children: ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const publicPaths = ["/auth/login", "/auth/callback", "/auth/error"]

  useEffect(() => {
    // 1. Verificación inicial de sesión
    checkAuth()

    // 2. ESCUCHA DE CAMBIOS: Vital para el APK. 
    // Cuando CapacitorAuthHandler hace 'setSession', este listener lo detecta.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
        setIsLoading(false) // Desbloquea la pantalla de carga inmediatamente
      } else {
        setUser(null)
        setProfile(null)
        if (!publicPaths.includes(pathname)) {
          setIsLoading(false)
          router.push("/auth/login")
        } else {
          setIsLoading(false)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [pathname])

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (!publicPaths.includes(pathname)) {
          router.push("/auth/login")
        }
        setIsLoading(false)
        return
      }
      setUser(user)
      await fetchProfile(user.id)
    } catch (error) {
      console.error("Error checking auth:", error)
      setIsLoading(false)
    }
  }

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single()

      setProfile(profile)

      if (profile && !profile.registration_complete && pathname !== "/registro") {
        router.push("/registro")
      } else if (profile?.registration_complete && pathname === "/registro") {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Cargando aplicación...</p>
        </div>
      </div>
    )
  }

  if (publicPaths.includes(pathname) || pathname === "/registro") {
    return <>{children}</>
  }

  return (
    <ThemeSettingsProvider>
      <ThemedContent user={user} profile={profile}>
        {children}
      </ThemedContent>
    </ThemeSettingsProvider>
  )
}

function ThemedContent({ children, user, profile }: { children: ReactNode, user: User | null, profile: UserProfile | null }) {
  const { theme } = useThemeSettings()
  return (
    <div className="min-h-screen relative" style={{ backgroundColor: theme.background_color, color: theme.text_color }}>
      {theme.background_image_url && (
        <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${theme.background_image_url})`, opacity: theme.background_opacity / 100 }} />
      )}
      <div className="relative z-10">{children}</div>
      <ThemeCustomizer />
    </div>
  )
}

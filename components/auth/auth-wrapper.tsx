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
  subscription_status?: string // Añadido para control de pagos
  trial_ends_at?: string       // Añadido para control de pagos
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

  // 1. ACTUALIZAMOS RUTAS PÚBLICAS (Añadimos /checkout y /)
  const publicPaths = ["/auth/login", "/auth/callback", "/auth/error", "/checkout", "/"]

  useEffect(() => {
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        // Solo redirigir si no es una ruta pública
        if (!publicPaths.some(path => pathname === path)) {
          router.push("/auth/login")
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
        setIsLoading(false)
        if (!publicPaths.some(path => pathname === path)) {
          router.push("/auth/login")
        }
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
        .from("profiles") // Cambiado a "profiles" para coincidir con tu tabla de suscripción
        .select("*")
        .eq("id", userId)
        .single()

      setProfile(profile)

      // 2. LÓGICA DE REDIRECCIÓN DINÁMICA
      if (profile) {
        const isExpired = new Date() > new Date(profile.trial_ends_at)
        const isNotActive = profile.subscription_status !== 'active'

        // Si expiró y no está en checkout, mandarlo allá
        if (isExpired && isNotActive && pathname.startsWith('/dashboard')) {
          router.push("/checkout")
          return
        }

        // Registro incompleto
        if (!profile.registration_complete && pathname !== "/registro") {
          router.push("/registro")
        } else if (profile.registration_complete && pathname === "/registro") {
          router.push("/dashboard")
        }
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
          <p className="text-gray-600 dark:text-gray-400 font-medium">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  // Rutas que no llevan el wrapper de tema (Login, Registro, Checkout)
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

// ... (ThemedContent se queda igual abajo)

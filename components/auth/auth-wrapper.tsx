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
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        if (!publicPaths.includes(pathname)) {
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
        if (!publicPaths.includes(pathname)) {
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
      // Usamos maybeSingle() para que no genere error si el usuario es nuevo
      const { data: profileData, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()

      if (error) throw error

      setProfile(profileData)

      // LÓGICA DE REDIRECCIÓN PARA NUEVOS USUARIOS
      // Si no hay datos de perfil (null) O el registro no está marcado como completo
      if (!profileData || !profileData.registration_complete) {
        if (pathname !== "/registro") {
          console.log("Perfil incompleto o inexistente, redireccionando a registro...")
          router.push("/registro")
        }
      } else if (profileData?.registration_complete && pathname === "/registro") {
        // Si el registro ya está hecho y trata de entrar a /registro, lo mandamos al home
        router.push("/")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Pantalla de carga mientras verificamos sesión y perfil
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Verificando cuenta...</p>
        </div>
      </div>
    )
  }

  // Rutas públicas (login, etc)
  if (publicPaths.includes(pathname)) {
    return <>{children}</>
  }

  // Página de registro (permitir que se vea para completar los datos)
  if (pathname === "/registro") {
    return <>{children}</>
  }

  // Si llegamos aquí, el usuario está autenticado y tiene perfil completo
  return (
    <ThemeSettingsProvider>
      <ThemedContent user={user} profile={profile}>
        {children}
      </ThemedContent>
    </ThemeSettingsProvider>
  )
}

function ThemedContent({ 
  children, 
  user,
  profile 
}: { 
  children: ReactNode
  user: User | null
  profile: UserProfile | null
}) {
  const { theme } = useThemeSettings()

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundColor: theme.background_color,
        color: theme.text_color,
      }}
    >
      {/* Imagen de fondo con opacidad controlada */}
      {theme.background_image_url && (
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${theme.background_image_url})`,
            opacity: theme.background_opacity / 100,
          }}
        />
      )}
      
      {/* Contenido principal sobre el fondo */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Botón flotante para personalizar el tema */}
      <ThemeCustomizer />
    </div>
  )
}

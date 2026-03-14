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
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single()

      setProfile(profile)

      // Redirect based on registration status
      if (profile && !profile.registration_complete && pathname !== "/registro") {
        router.push("/registro")
      } else if (profile?.registration_complete && pathname === "/registro") {
        router.push("/")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  // Public pages don't need auth wrapper content
  if (publicPaths.includes(pathname)) {
    return <>{children}</>
  }

  // Registration page
  if (pathname === "/registro") {
    return <>{children}</>
  }

  // Protected pages need full wrapper with theme
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
      {/* Background Image */}
      {theme.background_image_url && (
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${theme.background_image_url})`,
            opacity: theme.background_opacity / 100,
          }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Theme Customizer Button */}
      <ThemeCustomizer />
    </div>
  )
}

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
  subscription_status?: string
  trial_ends_at?: string
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
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      setProfile(profileData)

      if (profileData) {
        const isExpired = new Date() > new Date(profileData.trial_ends_at)
        const isNotActive = profileData.subscription_status !== 'active'

        if (isExpired && isNotActive && pathname.startsWith('/dashboard')) {
          router.push("/checkout")
          return
        }

        if (!profileData.registration_complete && pathname !== "/registro") {
          router.push("/registro")
        } else if (profileData.registration_complete && pathname === "/registro") {
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
      <ThemedContent user={user} profile={profile}>
        {children}
      </ThemedContent>
    </ThemeSettingsProvider>
  )
}

// ESTA ES LA FUNCIÓN QUE FALTABA O DABA ERROR
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
      {theme.background_image_url && (
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${theme.background_image_url})`,
            opacity: theme.background_opacity / 100,
          }}
        />
      )}
      
      <div className="relative z-10">
        {children}
      </div>

      <ThemeCustomizer />
    </div>
  )
}

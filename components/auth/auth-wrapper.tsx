"use client"

import { useEffect, useState, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { ThemeSettingsProvider } from "@/lib/theme-context"
import { ThemeCustomizer } from "@/components/dashboard/theme-customizer"

export function AuthWrapper({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false) // NUEVO: Para evitar Error #418
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const publicPaths = ["/auth/login", "/auth/callback", "/auth/error"]

  useEffect(() => {
    setIsMounted(true) // Marcamos que ya estamos en el navegador

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        if (!publicPaths.includes(pathname)) {
          router.push("/auth/login")
        }
      }
      setIsLoading(false)
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
    } catch (e) { 
      console.error("Error perfil:", e) 
    } finally {
      setIsLoading(false)
    }
  }

  // PASO CRÍTICO: Si no ha cargado el cliente, no renderizamos nada pesado
  if (!isMounted) return <div className="min-h-screen bg-gray-900" />

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

// ... Mantén tu función ThemedContent igual abajo

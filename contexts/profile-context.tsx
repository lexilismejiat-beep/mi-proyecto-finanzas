"use client"

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import type { Moneda } from "@/lib/monedas"

export interface Perfil {
  id: string
  cedula: string | null
  full_name: string | null
  email: string | null
  avatar_url: string | null
  dream: string | null
  moneda_visualizacion: Moneda
  saldo_inicial: number
  meta_mensual: number
  subscription_status: string | null
  trial_ends_at: string | null
}

interface UserProfileCedula {
  cedula: string | null
}

interface ProfileContextType {
  user: User | null
  perfil: Perfil | null
  cedula: string | null
  monedaVisualizacion: Moneda
  cargando: boolean
  recargar: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  // B2: profiles.cedula nunca se llena de forma confiable. user_profiles.cedula
  // es la única fuente de verdad para la cédula en toda la app.
  const [cedula, setCedula] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      setUser(authUser)

      if (!authUser) {
        setPerfil(null)
        setCedula(null)
        return
      }

      const [{ data: perfilData }, { data: userProfileData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle(),
        supabase.from("user_profiles").select("cedula").eq("id", authUser.id).maybeSingle(),
      ])

      setPerfil((perfilData as Perfil | null) ?? null)
      setCedula((userProfileData as UserProfileCedula | null)?.cedula ?? null)
    } catch (error) {
      console.error("Error cargando el perfil:", error)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const monedaVisualizacion: Moneda = perfil?.moneda_visualizacion ?? "COP"

  return (
    <ProfileContext.Provider
      value={{ user, perfil, cedula, monedaVisualizacion, cargando, recargar: cargar }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error("useProfile debe usarse dentro de un ProfileProvider")
  }
  return context
}

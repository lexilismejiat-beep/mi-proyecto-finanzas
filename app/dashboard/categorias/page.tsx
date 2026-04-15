"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
// ... (tus otros imports como Sidebar, TopBar, etc.)

export default function CategoriasPage() {
  const [profile, setProfile] = useState<any>(null)
  const [categorias, setCategorias] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      // 1. Obtener el usuario actual (Igual que en Transacciones)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 2. Obtener el perfil para el nombre/avatar
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      
      if (profileData) setProfile(profileData)

      // 3. ¡EL FILTRO CRÍTICO! 
      // Aquí es donde le decimos a Supabase: "Tráeme solo las categorías de este ID"
      const { data: categoriasData, error } = await supabase
        .from("categorias") // Asegúrate de que el nombre de la tabla sea correcto
        .select("*")
        .eq("user_id", user.id) // <--- ESTO evita que todos vean todo
      
      if (categoriasData) {
        setCategorias(categoriasData)
      }
    }

    fetchData()
  }, [supabase])

  return (
    // Aquí tu JSX usando el estado 'categorias' filtrado
  )
}

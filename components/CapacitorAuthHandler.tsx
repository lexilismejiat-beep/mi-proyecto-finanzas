"use client"

import { useEffect } from "react"
import { App } from "@capacitor/app"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function CapacitorAuthHandler() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Escuchamos cuando la app se abre vía URL (Deep Link)
    App.addListener("appUrlOpen", async (event: any) => {
      // Extraemos la parte de la URL después del # (donde viene el access_token)
      const url = new URL(event.url)
      const hash = url.hash
      
      if (hash) {
        // Supabase detecta automáticamente el hash en la URL si lo procesamos
        const { error } = await supabase.auth.getSession()
        
        if (!error) {
          // Si todo está bien, mandamos al usuario al dashboard
          router.push("/dashboard")
          router.refresh()
        }
      }
    })

    return () => {
      App.removeAllListeners()
    }
  }, [supabase, router])

  return null // Este componente no renderiza nada visualmente
}

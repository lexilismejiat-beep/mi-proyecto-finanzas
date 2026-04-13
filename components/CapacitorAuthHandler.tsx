"use client"

import { useEffect } from "react"
import { App } from "@capacitor/app"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function CapacitorAuthHandler() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // 1. Manejar el evento cuando la App se abre desde el navegador (Google Login)
    const setupListener = async () => {
      await App.addListener("appUrlOpen", async (event: any) => {
        // Obtenemos la URL completa que envió Google/Supabase
        const url = new URL(event.url)
        
        // Supabase pone los tokens después del '#'
        const hash = url.hash 
        
        if (hash) {
          // Forzamos a Supabase a que tome la sesión de ese hash
          const { data, error } = await supabase.auth.setSession({
            access_token: new URLSearchParams(hash.substring(1)).get("access_token") || "",
            refresh_token: new URLSearchParams(hash.substring(1)).get("refresh_token") || "",
          })

          if (!error && data.session) {
            console.log("Sesión establecida correctamente")
            router.push("/dashboard")
            router.refresh()
          } else {
            console.error("Error al establecer sesión:", error?.message)
          }
        }
      })
    }

    setupListener()

    return () => {
      App.removeAllListeners()
    }
  }, [supabase, router])

  return null
}

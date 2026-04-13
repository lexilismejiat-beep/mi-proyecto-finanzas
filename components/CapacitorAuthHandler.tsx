"use client"

import { useEffect } from "react"
import { App } from "@capacitor/app"
import { createClient } from "@/lib/supabase/client"

export default function CapacitorAuthHandler() {
  const supabase = createClient()

  useEffect(() => {
    const handleAuth = async (urlStr: string) => {
      if (!urlStr) return
      
      const url = new URL(urlStr)
      // Google manda los tokens después del '#'
      const params = new URLSearchParams(url.hash.substring(1))
      const accessToken = params.get("access_token")
      const refreshToken = params.get("refresh_token")

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (!error) {
          // Forzamos el salto al dashboard
          window.location.href = "/dashboard"
        }
      }
    }

    // Escucha cuando la app vuelve del navegador
    const listener = App.addListener("appUrlOpen", (data) => handleAuth(data.url))

    // Revisa si la app se abrió estando cerrada por el link
    App.getLaunchUrl().then(val => { if (val?.url) handleAuth(val.url) })

    return () => { listener.then(l => l.remove()) }
  }, [])

  return null
}

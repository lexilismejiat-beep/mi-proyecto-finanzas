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
      // Extraemos tokens del hash (#) o de la búsqueda (?)
      const params = new URLSearchParams(url.hash.substring(1) || url.search)
      const accessToken = params.get("access_token")
      const refreshToken = params.get("refresh_token")

      if (accessToken && refreshToken) {
        // Establecemos la sesión en Supabase
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (!error && data.session) {
          // Usamos window.location para forzar el refresco de la sesión 
          // y que el AuthWrapper detecte el cambio de inmediato.
          window.location.href = "/dashboard"
        }
      }
    }

    // Escucha si la app vuelve del navegador (App ya abierta)
    const listener = App.addListener("appUrlOpen", (event) => {
      handleAuth(event.url)
    })

    // Revisa si la app se inició directamente desde el enlace (App cerrada)
    const checkInitialUrl = async () => {
      const result = await App.getLaunchUrl()
      if (result?.url) {
        handleAuth(result.url)
      }
    }

    checkInitialUrl()

    return () => {
      listener.then(l => l.remove())
    }
  }, [supabase])

  return null
}

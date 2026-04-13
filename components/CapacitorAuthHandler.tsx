"use client"

import { useEffect } from "react"
import { App } from "@capacitor/app"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function CapacitorAuthHandler() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const handleAuth = async (urlStr: string) => {
      if (!urlStr) return
      
      const url = new URL(urlStr)
      // Buscamos tokens tanto en el hash (#) como en los parámetros (?)
      const params = new URLSearchParams(url.hash.substring(1) || url.search)
      const accessToken = params.get("access_token")
      const refreshToken = params.get("refresh_token")

      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (!error && data.session) {
          router.push("/dashboard")
          setTimeout(() => router.refresh(), 500)
        }
      }
    }

    // Caso A: La app ya estaba abierta en segundo plano
    const listener = App.addListener("appUrlOpen", (event) => {
      handleAuth(event.url)
    })

    // Caso B: La app estaba cerrada y se abrió con la URL de Google
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
  }, [supabase, router])

  return null
}

"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client" // Asegúrate de que esta ruta sea correcta

export default function RootPage() {
  const router = useRouter()
  const [isMounting, setIsMounting] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        router.replace("/dashboard")
      } else {
        router.replace("/auth/login") // O a donde quieras enviar a los no logueados
      }
      setIsMounting(false)
    }

    checkSession()
  }, [router])

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        {/* Este es el mensaje que verás mientras se sincroniza el APK y la Web */}
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="mt-4 text-white font-medium">Sincronizando sesión...</p>
      </div>
    </div>
  )
}

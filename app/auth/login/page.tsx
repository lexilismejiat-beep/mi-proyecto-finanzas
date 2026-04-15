"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isNative, setIsNative] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkNative = () => {
      const isCapacitor = !!(window as any).Capacitor?.isNative;
      const isAndroidApp = window.location.href.includes('http://localhost') && !window.location.port;
      return isCapacitor || isAndroidApp;
    };
    setIsNative(checkNative());

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setIsLoading(true);
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("registration_complete")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile?.registration_complete) {
          router.push("/dashboard");
        } else {
          router.push("/registro");
        }
        router.refresh();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router])

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const redirectURL = isNative 
        ? "com.misfinanzas.app://app" 
        : `${window.location.origin}/dashboard`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectURL,
          skipBrowserRedirect: false,
        },
      })

      if (error) {
        console.error("Error:", error.message)
        setIsLoading(false)
      }
    } catch (error) {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 font-sans">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-[#1e293b] text-white">
        <CardHeader className="text-center space-y-6 pb-2">
          {/* TU LOGO */}
          <div className="mx-auto w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 overflow-hidden">
            <Image 
              src="/logo.png" 
              alt="Logo Mis Finanzas" 
              width={60} 
              height={60} 
              className="object-contain"
            />
          </div>
          
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">Finanzas Personales</CardTitle>
            <CardDescription className="text-gray-400 font-medium">
              Gestiona tus finanzas de manera inteligente
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-8 pb-8">
          {/* BOTÓN BLANCO REFORZADO */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-12 flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 rounded-md font-bold text-sm shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                <span>Cargando...</span>
              </div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continuar con Google</span>
              </>
            )}
          </button>

          {/* ENLACES LEGALES COLOREADOS */}
          <div className="text-center space-y-3">
            <p className="text-[11px] text-gray-400 leading-relaxed px-4">
              Al continuar, Google compartirá tu nombre, correo y foto de perfil con Mis Finanzas. 
              Consulta nuestra{" "}
              <a href="#" className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold underline underline-offset-2">
                Política de Privacidad
              </a>{" "}
              y los{" "}
              <a href="#" className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold underline underline-offset-2">
                Términos de Servicio
              </a>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

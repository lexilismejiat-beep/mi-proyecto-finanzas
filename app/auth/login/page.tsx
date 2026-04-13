"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isNative, setIsNative] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // 1. Detectar si estamos en APK
    const checkNative = () => {
      const isCapacitor = !!(window as any).Capacitor?.isNative;
      const isAndroidApp = window.location.href.includes('http://localhost') && !window.location.port;
      return isCapacitor || isAndroidApp;
    };
    setIsNative(checkNative());

    // 2. ESCUCHA ACTIVA DE SESIÓN: Si el Handler de Capacitor tiene éxito, 
    // este listener detectará el cambio y nos sacará de la pantalla de carga.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push("/dashboard");
        router.refresh();
      } else if (event === 'SIGNED_OUT') {
        setIsLoading(false);
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
        console.error("Error logging in with Google:", error.message)
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white dark:bg-gray-900">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              <path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66" />
              <path d="m18 15-2-2" />
              <path d="m15 18-2-2" />
            </svg>
          </div>
          
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Finanzas Personales
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
              Gestiona tus finanzas de manera inteligente
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              variant="outline"
              className={cn(
                "w-full h-12 text-base font-semibold transition-all duration-200",
                "border-gray-300 shadow-sm", 
                "hover:shadow-md active:scale-[0.98]",
                isLoading && "opacity-80 cursor-not-allowed"
              )}
              style={{ 
                backgroundColor: 'white', 
                color: '#1a1a1a',
                borderColor: '#d1d5db' 
              }}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span style={{ color: '#666' }}>Conectando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="font-bold">Continuar con Google</span>
                </div>
              )}
            </Button>
          </div>
          
          <div className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <p>Al iniciar sesión, aceptas nuestros</p>
            <div className="flex flex-wrap justify-center gap-1">
              <a href="#" className="text-emerald-600 font-medium hover:underline">Términos de servicio</a>
              <span>y</span>
              <a href="#" className="text-emerald-600 font-medium hover:underline">Política de privacidad</a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Send, CheckCircle2, Loader2, User, ExternalLink } from "lucide-react"

interface UserProfile {
  id: string
  nombres: string
  apellidos: string
  email: string
  avatar_url: string | null
  cedula?: string // Por si aún usas este campo en otros lados
}

interface CedulaSectionProps {
  profile?: UserProfile | null
  cardColor?: string
  textColor?: string
  primaryColor?: string
}

export function CedulaSection({ 
  profile,
  cardColor, 
  textColor,
  primaryColor = "#10b981"
}: CedulaSectionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // URL de tu bot Lex Finanzas
  const BASE_BOT_URL = "https://t.me/Lex_Mis_Finanzas_bot"

  const handleUpdateAndRedirect = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Usamos el ID del perfil porque es un UUID seguro para Telegram 
    // (no contiene @ ni puntos que rompan el enlace)
    if (!profile?.id) return

    setIsLoading(true)
    
    try {
      setIsSaved(true)
      
      // Construimos la URL: t.me/bot?start=ID_DE_USUARIO
      // Telegram enviará al bot: "/start ID_DE_USUARIO"
      const TELEGRAM_BOT_URL = `${BASE_BOT_URL}?start=${profile.id}`

      // Redirección con un pequeño delay para feedback visual
      setTimeout(() => {
        window.location.href = TELEGRAM_BOT_URL
      }, 1000)

    } catch (error) {
      console.error("Error redirecting to Telegram:", error)
      // Fallback en caso de error
      window.location.href = BASE_BOT_URL
    }
  }

  return (
    <div className="space-y-4">
      {/* Tarjeta de Información de Usuario */}
      {profile && (
        <Card className="border-border shadow-sm" style={{ backgroundColor: cardColor }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2" style={{ color: textColor }}>
              <User className="h-4 w-4" style={{ color: primaryColor }} />
              Tu Información
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-sm shadow-inner"
                style={{ backgroundColor: primaryColor }}
              >
                {profile.nombres?.[0]}{profile.apellidos?.[0]}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: textColor }}>
                  {profile.nombres} {profile.apellidos}
                </p>
                <p className="text-[11px] opacity-70 italic" style={{ color: textColor }}>
                  {profile.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tarjeta de Vinculación con Telegram */}
      <Card className="border-border shadow-md" style={{ backgroundColor: cardColor }}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div 
              className="flex h-9 w-9 items-center justify-center rounded-lg shadow-sm"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <Send className="h-4 w-4" style={{ color: primaryColor }} />
            </div>
            <div>
              <CardTitle className="text-sm font-bold" style={{ color: textColor }}>
                Vinculación Telegram
              </CardTitle>
              <CardDescription className="text-[11px] font-medium" style={{ color: textColor, opacity: 0.7 }}>
                Activa tu bot para registrar gastos automáticamente
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateAndRedirect} className="space-y-4">
            <Button
              type="submit"
              disabled={isLoading || !profile}
              className="w-full h-10 gap-2 text-xs font-bold transition-all active:scale-95 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSaved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Conectando con Telegram...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Actualizar y Vincular Bot
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-4 pt-3 border-t border-border/50">
            <p className="text-[10px] text-center leading-relaxed italic opacity-60" style={{ color: textColor }}>
              Al hacer clic, serás enviado a Telegram. Solo presiona el botón "Iniciar" en el chat para terminar.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

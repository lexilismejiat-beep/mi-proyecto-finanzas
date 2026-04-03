"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Send, CheckCircle2, Loader2, User, ExternalLink } from "lucide-react"

interface UserProfile {
  id: string
  nombres: string
  apellidos: string
  email: string // Asegúrate de que el perfil traiga el email
  avatar_url: string | null
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

  const handleUpdateAndRedirect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.email) return

    setIsLoading(true)
    
    // 1. Preparamos la URL de Telegram con el correo como parámetro 'start'
    // El parámetro 'start' en Telegram no acepta caracteres especiales raros, 
    // así que lo limpiamos un poco por seguridad.
    const encodedEmail = btoa(profile.email).replace(/=/g, ""); // Usamos Base64 simple para evitar líos con puntos o arrobas en la URL
    const TELEGRAM_BOT_URL = `https://t.me/Lex_Mis_Finanzas_bot?start=${encodedEmail}`

    try {
      setIsSaved(true)
      
      // 2. Redirección automática
      // Esperamos un segundo para que el usuario vea el estado "Redirigiendo"
      setTimeout(() => {
        window.location.href = TELEGRAM_BOT_URL
      }, 1000)

    } catch (error) {
      console.error("Error redirecting:", error)
      window.location.href = `https://t.me/Lex_Mis_Finanzas_bot?start=${profile.email}`
    } finally {
      // No reseteamos el loading para mantener la sensación de redirección
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
              Tu Cuenta
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
                Conecta tu cuenta para registrar gastos por voz o chat.
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
                  Redirigiendo...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Vincular mi Telegram
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-4 pt-3 border-t border-border/50">
            <p className="text-[10px] text-center leading-relaxed italic opacity-60" style={{ color: textColor }}>
              Al hacer clic, se abrirá Telegram. Presiona "Iniciar" para completar la vinculación automática.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

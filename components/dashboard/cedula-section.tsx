"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, CheckCircle2, Loader2, User, Phone, MapPin, Calendar, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface UserProfile {
  id: string
  nombres: string
  apellidos: string
  cedula: string
  telefono: string
  fecha_nacimiento: string | null
  genero: string | null
  direccion: string | null
  ciudad: string | null
  pais: string | null
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
  const [cedula, setCedula] = useState(profile?.cedula || "")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const supabase = createClient()

  // URL de tu bot Lex Finanzas
  const TELEGRAM_BOT_URL = "https://t.me/lex_finanzas_bot"

  const handleUpdateAndRedirect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cedula.trim() || !profile) return

    setIsLoading(true)
    try {
      // 1. Guardamos en Supabase
      const { error } = await supabase
        .from("user_profiles")
        .update({ 
          cedula: cedula.trim(), 
          updated_at: new Date().toISOString() 
        })
        .eq("id", profile.id)

      if (error) throw error
      
      setIsSaved(true)

      // 2. Redirección forzada usando el método más compatible
      // Abrimos en la misma pestaña para evitar bloqueadores de pop-ups
      window.location.replace(TELEGRAM_BOT_URL)

    } catch (error) {
      console.error("Error updating profile:", error)
      // Fallback: Si falla la DB, intentamos enviarlo al bot de todos modos
      window.location.replace(TELEGRAM_BOT_URL)
    } finally {
      setIsLoading(false)
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
                  ID: {profile.cedula || "No registrada"}
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
                Actualiza tu cédula para recibir notificaciones
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateAndRedirect} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="cedula-input" className="text-[11px] font-bold uppercase tracking-wider opacity-80" style={{ color: textColor }}>
                Número de Cédula
              </label>
              <Input
                id="cedula-input"
                type="text"
                placeholder="Ingresa tu documento"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                className="h-9 text-sm"
                style={{ 
                  backgroundColor: `${textColor}05`,
                  color: textColor,
                  borderColor: `${textColor}20`
                }}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
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
                  Actualizar y Vincular Bot
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-4 pt-3 border-t border-border/50">
            <p className="text-[10px] text-center leading-relaxed italic opacity-60" style={{ color: textColor }}>
              Al actualizar, serás enviado automáticamente a nuestro bot oficial en Telegram.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

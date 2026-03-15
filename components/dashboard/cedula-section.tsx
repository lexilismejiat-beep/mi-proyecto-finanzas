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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cedula.trim() || !profile) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ 
          cedula: cedula.trim(), 
          updated_at: new Date().toISOString() 
        })
        .eq("id", profile.id)

      if (error) throw error
      
      setIsSaved(true)

      // REDIRECCIÓN DIRECTA: Cambiamos window.open por window.location.href
      // Esto evita que el navegador lo bloquee como "ventana emergente"
      setTimeout(() => {
        window.location.href = "https://t.me/lex_finanzas_bot"
      }, 1000)

    } catch (error) {
      console.error("Error updating cedula:", error)
      alert("Error al guardar. Verifica tu conexión.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Información del Perfil */}
      {profile && (
        <Card className="border-border" style={{ backgroundColor: cardColor }}>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2" style={{ color: textColor }}>
              <User className="h-5 w-5" style={{ color: primaryColor }} />
              Tu Información
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div 
                className="flex h-12 w-12 items-center justify-center rounded-full text-white font-bold text-lg"
                style={{ backgroundColor: primaryColor }}
              >
                {profile.nombres?.[0]}{profile.apellidos?.[0]}
              </div>
              <div>
                <p className="font-medium" style={{ color: textColor }}>
                  {profile.nombres} {profile.apellidos}
                </p>
                <p className="text-sm opacity-60" style={{ color: textColor }}>
                  CC: {cedula || "No registrada"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sección de Telegram */}
      <Card className="border-border" style={{ backgroundColor: cardColor }}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div 
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <Send className="h-5 w-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold" style={{ color: textColor }}>
                Vinculación Telegram
              </CardTitle>
              <CardDescription className="text-sm opacity-60" style={{ color: textColor }}>
                Registra tu cédula para ir al bot
              </CardDescription>
            </div>
          </div>
        </Header>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <label htmlFor="cedula" className="text-sm font-medium" style={{ color: textColor }}>
                Número de Cédula
              </label>
              <Input
                id="cedula"
                type="text"
                placeholder="Ej: 12345678"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                style={{ backgroundColor: `${textColor}10`, color: textColor }}
              />
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full gap-2 text-white font-bold"
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSaved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Redirigiendo a Telegram...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Guardar e Ir al Bot
                </>
              )}
            </Button>
          </form>
          
          <p className="mt-3 text-[10px] text-center opacity-50" style={{ color: textColor }}>
            @lex_finanzas_bot se abrirá automáticamente.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

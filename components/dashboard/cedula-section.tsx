"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, CheckCircle2, Loader2, User, Phone, MapPin, Calendar } from "lucide-react"
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
      await supabase
        .from("user_profiles")
        .update({ cedula, updated_at: new Date().toISOString() })
        .eq("id", profile.id)
      
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch (error) {
      console.error("Error updating cedula:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* User Info Card */}
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
                  {profile.cedula || "Sin cédula registrada"}
                </p>
              </div>
            </div>
            
            {profile.telefono && (
              <div className="flex items-center gap-2 text-sm" style={{ color: textColor }}>
                <Phone className="h-4 w-4 opacity-60" />
                <span>{profile.telefono}</span>
              </div>
            )}
            
            {profile.ciudad && (
              <div className="flex items-center gap-2 text-sm" style={{ color: textColor }}>
                <MapPin className="h-4 w-4 opacity-60" />
                <span>{profile.ciudad}, {profile.pais}</span>
              </div>
            )}
            
            {profile.fecha_nacimiento && (
              <div className="flex items-center gap-2 text-sm" style={{ color: textColor }}>
                <Calendar className="h-4 w-4 opacity-60" />
                <span>{new Date(profile.fecha_nacimiento).toLocaleDateString("es-CO", { 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Telegram Vinculación Card */}
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
                Actualiza tu cédula para recibir notificaciones
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <label
                htmlFor="cedula"
                className="text-sm font-medium"
                style={{ color: textColor }}
              >
                Número de Cédula
              </label>
              <Input
                id="cedula"
                type="text"
                placeholder="Ingresa tu número de cédula"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                className="border-border"
                style={{ 
                  backgroundColor: `${textColor}10`,
                  color: textColor
                }}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !cedula.trim()}
              className="gap-2 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : isSaved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Guardado
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Actualizar
                </>
              )}
            </Button>
          </form>
          <p className="mt-3 text-xs opacity-60" style={{ color: textColor }}>
            Al vincular tu cédula, recibirás alertas de transacciones y resúmenes
            semanales directamente en tu Telegram.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

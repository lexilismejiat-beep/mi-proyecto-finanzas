"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Send, User, ExternalLink, Copy, Check, Sparkles, Fingerprint } from "lucide-react"

interface UserProfile {
  id: string
  full_name: string // Campo real en tu tabla
  email: string
  avatar_url: string | null
  telegram_chat_id?: string | null
}

interface CedulaSectionProps {
  profile?: UserProfile | null
  cardColor?: string
  textColor?: string
  primaryColor?: string
}

export function CedulaSection({ 
  profile,
  cardColor = "#1A1B1F", 
  textColor = "#FFFFFF",
  primaryColor = "#10b981"
}: CedulaSectionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Función de copiado con protección de nulidad
  const copyToClipboard = () => {
    if (profile?.id) {
      navigator.clipboard.writeText(profile.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRedirect = () => {
    setIsLoading(true)
    window.location.href = "https://t.me/Lex_Mis_Finanzas_bot"
  }

  // Si el perfil no ha cargado, mostramos un estado simple para evitar el crash
  if (!profile) {
    return (
      <Card className="p-6 text-center opacity-50" style={{ backgroundColor: cardColor, color: textColor }}>
        Cargando identidad...
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-xl overflow-hidden" style={{ backgroundColor: cardColor, color: textColor }}>
        <div className="h-1.5 w-full" style={{ backgroundColor: primaryColor }} />
        <CardHeader className="pb-2">
          <CardTitle className="text-[14px] font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: primaryColor }} />
            Tu Identidad Financiera
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Perfil Visual */}
          <div className="flex items-center gap-4">
            <div 
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white/10 shadow-lg overflow-hidden"
              style={{ backgroundColor: primaryColor }}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold">{profile.full_name?.charAt(0) || "U"}</span>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-base font-bold truncate">
                {profile.full_name || "Usuario"}
              </p>
              <p className="text-[10px] opacity-50 uppercase tracking-tighter">
                Gestor de Sueños
              </p>
            </div>
          </div>

          {/* Caja de ID (La "Llave") */}
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 overflow-hidden">
                <Fingerprint className="h-4 w-4 shrink-0 opacity-40" />
                <code className="text-[11px] font-mono opacity-80 truncate">
                  {profile.id}
                </code>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-white/10 shrink-0" 
                onClick={copyToClipboard}
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Botón Telegram */}
          <Button
            onClick={handleRedirect}
            className="w-full h-11 gap-2 text-xs font-bold transition-all hover:brightness-110 text-white rounded-xl"
            style={{ backgroundColor: primaryColor }}
          >
            <ExternalLink className="h-4 w-4" />
            Vincular Telegram
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

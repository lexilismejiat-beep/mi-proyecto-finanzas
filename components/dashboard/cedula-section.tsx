"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, Fingerprint, Mail, Target, ExternalLink } from "lucide-react"

interface UserProfile {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  dream?: string | null
  cedula?: string | null
}

interface CedulaSectionProps {
  profile?: UserProfile | null
  cardColor?: string
  textColor?: string
  primaryColor?: string
}

export function CedulaSection({ 
  profile,
  cardColor = "#FFFFFF", 
  textColor = "#1e293b",
  primaryColor = "#10b981" 
}: CedulaSectionProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    if (profile?.id) {
      navigator.clipboard.writeText(profile.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!profile) return <div className="h-64 w-full bg-gray-100 animate-pulse rounded-2xl" />

  return (
    <div className="space-y-4">
      {/* Tarjeta de Identidad Premium */}
      <Card className="border-none shadow-xl overflow-hidden rounded-2xl" style={{ backgroundColor: cardColor }}>
        <div className="h-2 w-full" style={{ backgroundColor: primaryColor }} />
        
        <CardContent className="p-6 space-y-6">
          {/* Encabezado: Foto y Nombre */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-slate-100 shadow-inner overflow-hidden flex items-center justify-center bg-slate-200">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold opacity-40">{profile.full_name?.charAt(0)}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: primaryColor }} />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold" style={{ color: textColor }}>{profile.full_name}</h3>
              <div className="flex items-center justify-center gap-1.5 opacity-60">
                <Mail className="h-3 w-3" />
                <span className="text-[11px]">{profile.email}</span>
              </div>
            </div>
          </div>

          {/* Sección del Sueño (Viene de Configuración) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
            <div className="mt-1 p-2 bg-white rounded-lg shadow-sm">
              <Target className="h-4 w-4" style={{ color: primaryColor }} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-40">Mi Sueño Financiero</p>
              <p className="text-sm font-medium italic" style={{ color: textColor }}>
                {profile.dream || "Aún no has definido una meta en configuración"}
              </p>
            </div>
          </div>

          {/* ID de Sincronización */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold opacity-40 ml-1">ID DE VINCULACIÓN</p>
            <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl">
              <div className="flex items-center gap-2 overflow-hidden">
                <Fingerprint className="h-4 w-4 text-white/30" />
                <code className="text-[10px] text-white/80 font-mono truncate">
                  {profile.id.substring(0, 18)}...
                </code>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/10" 
                onClick={copyToClipboard}
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Botón de Acción */}
          <Button 
            className="w-full h-11 rounded-xl font-bold text-white gap-2 shadow-lg transition-transform active:scale-95"
            style={{ backgroundColor: primaryColor }}
            onClick={() => window.open("https://t.me/Lex_Mis_Finanzas_bot", "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
            Vincular Telegram
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

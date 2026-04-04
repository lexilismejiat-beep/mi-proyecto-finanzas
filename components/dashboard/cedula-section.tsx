"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Send, CheckCircle2, Loader2, User, ExternalLink, Copy, Check } from "lucide-react"

interface UserProfile {
  id: string
  nombres: string
  apellidos: string
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
  cardColor, 
  textColor,
  primaryColor = "#10b981"
}: CedulaSectionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Función para copiar el UUID al portapapeles
  const copyToClipboard = () => {
    if (profile?.id) {
      navigator.clipboard.writeText(profile.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // Reset del icono tras 2s
    }
  }

  const handleRedirect = () => {
    setIsLoading(true)
    // Redirección limpia al bot sin parámetros conflictivos
    window.location.href = "https://t.me/Lex_Mis_Finanzas_bot"
  }

  return (
    <div className="space-y-4">
      {/* Tarjeta de Identificación de Usuario */}
      {profile && (
        <Card className="border-border shadow-sm" style={{ backgroundColor: cardColor }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-[12px] font-bold flex items-center gap-2" style={{ color: textColor }}>
              <User className="h-3 w-3" style={{ color: primaryColor }} />
              Tu Identificador de Cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between bg-black/5 p-3 rounded-md border border-dashed border-border/50">
              <code className="text-[11px] font-mono font-bold opacity-90" style={{ color: textColor }}>
                {profile.id.substring(0, 8)}...{profile.id.substring(profile.id.length - 4)}
              </code>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-black/10" 
                onClick={copyToClipboard}
                title="Copiar ID completo"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" style={{ color: textColor }} />
                )}
              </Button>
            </div>
            <p className="text-[10px] leading-tight opacity-60 italic" style={{ color: textColor }}>
              Copia este código y pégalo en el chat de Telegram cuando el bot te lo solicite para vincular tu cuenta.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tarjeta de Acción Telegram */}
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
                Bot Lex Finanzas
              </CardTitle>
              <CardDescription className="text-[11px] font-medium" style={{ color: textColor, opacity: 0.7 }}>
                {profile?.telegram_chat_id 
                  ? "Vinculación activa detectada." 
                  : "Conecta tu Telegram para registrar gastos por voz."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleRedirect}
            disabled={isLoading || !profile}
            className="w-full h-10 gap-2 text-xs font-bold transition-all active:scale-95 text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                {profile?.telegram_chat_id ? "Abrir Telegram" : "Ir a vincular Telegram"}
              </>
            )}
          </Button>
          
          <div className="mt-4 pt-3 border-t border-border/50">
            <p className="text-[10px] text-center leading-relaxed italic opacity-60" style={{ color: textColor }}>
              1. Copia tu ID arriba. <br />
              2. Ve al bot y presiona "Iniciar". <br />
              3. Pega tu ID cuando el bot te lo pida.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

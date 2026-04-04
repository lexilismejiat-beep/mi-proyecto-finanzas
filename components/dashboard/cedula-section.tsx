"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Send, User, ExternalLink, Copy, Check, Sparkles, Fingerprint } from "lucide-react"

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

  return (
    <div className="space-y-4">
      {/* Tarjeta de Identidad y Sueño Financiero */}
      {profile && (
        <Card className="border-none shadow-lg overflow-hidden" style={{ backgroundColor: cardColor }}>
          <div className="h-1.5 w-full" style={{ backgroundColor: primaryColor }} />
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px] font-bold flex items-center gap-2" style={{ color: textColor }}>
              <Sparkles className="h-4 w-4" style={{ color: primaryColor }} />
              Tu Identidad Financiera
            </CardTitle>
            <CardDescription className="text-[11px] opacity-70" style={{ color: textColor }}>
              El primer paso hacia tu libertad económica.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Perfil Visual */}
            <div className="flex items-center gap-3 p-2">
              <div 
                className="flex h-12 w-12 items-center justify-center rounded-full text-white font-bold text-lg shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                {profile.nombres?.[0]}{profile.apellidos?.[0]}
              </div>
              <div>
                <p className="text-sm font-bold leading-none mb-1" style={{ color: textColor }}>
                  {profile.nombres} {profile.apellidos}
                </p>
                <p className="text-[11px] opacity-60" style={{ color: textColor }}>
                  Gestor de Sueños
                </p>
              </div>
            </div>

            {/* Caja de ID Estilizada */}
            <div className="relative group">
              <div className="absolute -top-2 left-3 bg-white px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border shadow-sm" style={{ color: primaryColor }}>
                Llave de Sincronización
              </div>
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                   <Fingerprint className="h-4 w-4 opacity-40" />
                   <code className="text-[12px] font-mono font-bold tracking-tighter" style={{ color: textColor }}>
                    {profile.id.substring(0, 8)}...{profile.id.substring(profile.id.length - 4)}
                  </code>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-2 bg-white hover:bg-slate-50 transition-all shadow-sm" 
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <><Check className="h-3.5 w-3.5 text-green-500" /> <span className="text-[10px]">Copiado</span></>
                  ) : (
                    <><Copy className="h-3.5 w-3.5" /> <span className="text-[10px]">Copiar</span></>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tarjeta de Acción Telegram */}
      <Card className="border-border shadow-md" style={{ backgroundColor: cardColor }}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mb-2">
              <Send className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: textColor }}>¿Listo para el siguiente nivel?</h3>
              <p className="text-[11px] opacity-70 px-4 mt-1" style={{ color: textColor }}>
                Vincula tu bot para registrar cada gasto al instante con solo un mensaje de voz o texto.
              </p>
            </div>
            
            <Button
              onClick={handleRedirect}
              disabled={isLoading || !profile}
              className="w-full h-11 gap-2 text-xs font-bold transition-all hover:brightness-110 active:scale-[0.98] text-white shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? (
                "Abriendo Telegram..."
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Abrir Lex Finanzas Bot
                </>
              )}
            </Button>

            <div className="flex justify-center gap-4 text-[10px] opacity-40 italic">
              <span>1. Copia</span>
              <span>→</span>
              <span>2. Inicia</span>
              <span>→</span>
              <span>3. Pega</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

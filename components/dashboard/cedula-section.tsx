"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Copy, Check, Fingerprint, Mail, Phone, ExternalLinkIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// 1. Interfaces Actualizadas para reflejar el perfil completo y el tema
interface UserProfile {
  id: string
  nombres: string
  apellidos: string
  email: string
  avatar_url: string | null
  // Añadimos teléfono si lo tienes en la DB, para asemejar más el ejemplo
  telefono?: string | null 
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
  // Usamos el cardColor si existe, si no, un fallback elegante
  cardColor, 
  textColor = "#FFFFFF", // Por defecto, asumimos texto claro para contraste
  primaryColor = "#10b981"
}: CedulaSectionProps) {
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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

  // Si no hay perfil, mostramos un estado elegante de carga o vacío
  if (!profile) {
    return (
      <Card className="shadow-2xl rounded-2xl p-6 border-none" style={{ backgroundColor: "#1A1B1F", color: textColor }}>
        Cargando Identidad...
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 2. Tarjeta de Identidad Premium (Inspiración La Orchila) */}
      <Card className="shadow-2xl rounded-2xl border-none overflow-hidden transform hover:scale-[1.01] transition-transform" style={{ backgroundColor: "#1A1B1F", color: textColor }}>
        {/* Línea decorativa superior */}
        <div className="h-1 w-full" style={{ backgroundColor: primaryColor }} />
        
        <CardContent className="p-8 space-y-8 relative">
          
          {/* Fondo decorativo sutil (como las líneas del ejemplo) */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 80C20 60 40 100 60 80C80 60 100 100 100 100V100H0V80Z" stroke={primaryColor} strokeWidth="0.5"/>
            </svg>
          </div>

          {/* Sección Superior: Foto y Nombre */}
          <div className="flex flex-col items-center justify-center gap-6 relative z-10 text-center">
            
            {/* 3. Foto de Perfil Prominente */}
            <div className="relative group">
              <div 
                className="flex h-24 w-24 items-center justify-center rounded-full border-4 shadow-xl overflow-hidden" 
                style={{ borderColor: "#2F3137" }}
              >
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Foto de Perfil" 
                    className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-60" 
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center font-bold text-3xl" style={{ backgroundColor: primaryColor, color: "#FFFFFF" }}>
                    {profile.nombres?.[0]}{profile.apellidos?.[0]}
                  </div>
                )}
              </div>
              
              {/* Overlay con instrucciones para cambiar foto (si implementas la subida) */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-white font-medium px-2">Editar en Config.</p>
              </div>
            </div>
            
            <div className="space-y-1">
              {/* 4. Nombre Elegante (como La Orchila) */}
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: "#F7F8F8" }}>
                {profile.nombres} {profile.apellidos}
              </h2>
              <p className="text-xs italic opacity-60 tracking-widest uppercase">
                Gestor de Sueños Financieros
              </p>
            </div>
          </div>

          {/* Sección Media: Caja de ID con Título */}
          <div className="relative group relative z-10 pt-4">
              <div className="absolute -top-3 left-6 bg-slate-900 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm" style={{ color: primaryColor, borderColor: "#2F3137" }}>
                Llave de Sincronización
              </div>
              <div className="flex items-center justify-between bg-black/30 p-5 rounded-2xl border transition-colors group-hover:border-primary/40" style={{ borderColor: "#2F3137" }}>
                <div className="flex items-center gap-2">
                   <Fingerprint className="h-5 w-5 opacity-40" />
                   <code className="text-[13px] font-mono font-medium tracking-tight" style={{ color: "#F7F8F8" }}>
                    {profile.id}
                  </code>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 gap-2 transition-all shadow-sm rounded-lg hover:bg-black/50" 
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <><Check className="h-4 w-4 text-green-500" /> <span className="text-[10px]">Copiado</span></>
                  ) : (
                    <><Copy className="h-4 w-4" style={{ color: textColor }} /> <span className="text-[10px]">Copiar</span></>
                  )}
                </Button>
              </div>
            </div>

          {/* Sección Inferior: Detalles de Contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 pt-4 text-xs tracking-tight relative z-10">
            {/* Correo */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/30 border" style={{ borderColor: "#2F3137" }}>
                <Mail className="h-4 w-4 opacity-50" />
              </div>
              <p style={{ color: "#F7F8F8" }}>{profile.email}</p>
            </div>
            
            {/* Teléfono (Opcional, si tienes el dato) */}
            {profile.telefono && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/30 border" style={{ borderColor: "#2F3137" }}>
                  <Phone className="h-4 w-4 opacity-50" />
                </div>
                <p style={{ color: "#F7F8F8" }}>{profile.telefono}</p>
              </div>
            )}
            
             {/* Cédula/ID (Opcional, si tienes el dato) */}
            {profile.cedula && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/30 border" style={{ borderColor: "#2F3137" }}>
                  <User className="h-4 w-4 opacity-50" />
                </div>
                <p style={{ color: "#F7F8F8" }}>ID: {profile.cedula}</p>
              </div>
            )}

          </div>

          <div className="pt-4 text-center text-[10px] italic opacity-40 relative z-10" style={{ color: textColor }}>
            * Sincroniza esta identidad en Telegram para empezar a registrar gastos.
          </div>

        </CardContent>
      </Card>

      {/* Tarjeta de Acción Telegram (Pulsar para abrir) */}
      <Card className="shadow-2xl rounded-2xl border-none" style={{ backgroundColor: cardColor }}>
        <CardContent className="p-6">
          <Button
            onClick={handleRedirect}
            disabled={isLoading}
            className="w-full h-12 gap-3 text-sm font-bold transition-all hover:brightness-110 active:scale-[0.98] text-white shadow-xl rounded-xl"
            style={{ backgroundColor: primaryColor }}
          >
            {isLoading ? (
              "Abriendo Telegram..."
            ) : (
              <>
                <ExternalLinkIcon className="h-5 w-5" />
                Abrir Lex Finanzas Bot
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

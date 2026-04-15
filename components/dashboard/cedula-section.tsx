"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Send, Copy, Target, MessageCircle } from "lucide-react" // Añadimos MessageCircle
import { toast } from "sonner"

interface CedulaSectionProps {
  profile: any;
}

export function CedulaSection({ profile }: CedulaSectionProps) {
  const copyToClipboard = () => {
    if (profile?.id) {
      navigator.clipboard.writeText(profile.id)
      toast.success("ID copiado")
    }
  }

  return (
    <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
      <div className="h-1.5 w-full bg-emerald-500" />
      
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-widest">
          <Target className="h-3.5 w-3.5" />
          Tu Identidad Financiera
        </div>

        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full border-2 border-emerald-50 overflow-hidden bg-slate-50 shadow-sm">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Avatar" 
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + (profile?.nombres || 'U') + '&background=10b981&color=fff';
                }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xl font-bold text-emerald-600">
                {profile?.nombres?.charAt(0) || "U"}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-800 truncate">
              {profile?.nombres} {profile?.apellidos}
            </h3>
            <p className="text-[11px] font-medium text-emerald-600 uppercase leading-tight mt-0.5 line-clamp-2">
              {profile?.dream || "Define tu meta en configuración"}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 group relative">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-tighter">ID de Cuenta</span>
            <div className="flex items-center justify-between">
              <code className="text-[10px] text-slate-600 font-mono truncate max-w-[180px]">
                {profile?.id || "Cargando..."}
              </code>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                onClick={copyToClipboard}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* --- SECCIÓN DE BOTONES --- */}
        <div className="space-y-2">
          {/* Botón Telegram */}
          <Button 
            className="w-full bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold h-10 rounded-lg shadow-sm gap-2 transition-transform active:scale-[0.98]"
            onClick={() => window.open('https://t.me/Lex_Mis_Finanzas_bot', '_blank')}
          >
            <Send className="h-4 w-4" />
            Vincular Telegram
          </Button>

          {/* Botón WhatsApp */}
          <Button 
            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-10 rounded-lg shadow-sm gap-2 transition-transform active:scale-[0.98]"
            onClick={() => window.open('https://wa.me/573054164092', '_blank')}
          >
            <MessageCircle className="h-4 w-4" />
            Vincular WhatsApp
          </Button>
        </div>
        
        <p className="text-[9px] text-center text-slate-400">
          Usa tu ID para recibir alertas de gastos en tiempo real
        </p>
      </CardContent>
    </Card>
  )
}

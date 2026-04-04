"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Send, Copy, Target } from "lucide-react"
import { toast } from "sonner"

interface CedulaSectionProps {
  profile: any; // Datos que vienen de user_profiles
}

export function CedulaSection({ profile }: CedulaSectionProps) {
  const copyToClipboard = () => {
    if (profile?.id) {
      navigator.clipboard.writeText(profile.id)
      toast.success("ID copiado al portapapeles")
    }
  }

  return (
    <Card className="overflow-hidden border-none shadow-2xl bg-white dark:bg-zinc-950">
      <div className="h-2 w-full bg-emerald-500" /> {/* Línea decorativa verde */}
      
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
          <Target className="h-4 w-4" />
          TU IDENTIDAD FINANCIERA
        </div>

        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full border-2 border-emerald-100 overflow-hidden bg-slate-100">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xl font-bold text-emerald-600">
                {profile?.nombres?.charAt(0) || "U"}
              </div>
            )}
          </div>
          <div>
            {/* USAMOS NOMBRES Y APELLIDOS DE USER_PROFILES */}
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {profile?.nombres} {profile?.apellidos}
            </h3>
            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">
              {profile?.dream ? profile.dream : "Define tu sueño en Configuración"}
            </p>
          </div>
        </div>

        {/* ID DE CUENTA */}
        <div className="bg-slate-50 dark:bg-zinc-900 rounded-xl p-4 border border-slate-100 dark:border-zinc-800">
          <div className="flex items-center justify-between group">
            <code className="text-[10px] text-slate-500 font-mono break-all pr-2">
              {profile?.id || "Cargando ID..."}
            </code>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 shrink-0 hover:bg-emerald-50 hover:text-emerald-600"
              onClick={copyToClipboard}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[9px] text-slate-400 mt-2 text-center">
            Copia este ID para vincularlo con tu Bot de Telegram
          </p>
        </div>

        <Button 
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-12 shadow-md shadow-emerald-200 dark:shadow-none gap-2"
          onClick={() => window.open('https://t.me/TuBotNombre', '_blank')}
        >
          <Send className="h-4 w-4" />
          Vincular Telegram
        </Button>
      </CardContent>
    </Card>
  )
}

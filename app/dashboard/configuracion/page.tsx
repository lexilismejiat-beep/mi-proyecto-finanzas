"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Save, Target, Camera, MapPin, User as UserIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ConfiguracionPage() {
  const supabase = createClient()
  const { theme } = useThemeSettings()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // --- ESTADOS PARA NAVEGACIÓN MÓVIL ---
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        
        const { data: mainProfile } = await supabase
          .from("profiles")
          .select("avatar_url, dream")
          .eq("id", user.id)
          .single()

        setProfile({ ...data, ...mainProfile })
      }
      setLoading(false)
    }
    loadProfile()
  }, [supabase])

  // ... (tus funciones handleUploadAvatar y handleSaveAll se mantienen igual)

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: errorUser } = await supabase
        .from("user_profiles")
        .update({
          nombres: profile.nombres,
          apellidos: profile.apellidos,
          cedula: profile.cedula,
          telefono: profile.telefono,
          genero: profile.genero,
          fecha_nacimiento: profile.fecha_nacimiento,
          direccion: profile.direccion,
          ciudad: profile.ciudad,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (errorUser) throw errorUser;

      const { error: errorMain } = await supabase
        .from("profiles")
        .update({
          avatar_url: profile.avatar_url,
          dream: profile.dream,
          full_name: `${profile.nombres} ${profile.apellidos}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (errorMain) throw errorMain;

      toast.success("¡Cambios guardados!");
      setTimeout(() => { window.location.reload(); }, 500);
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-emerald-500" /></div>

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-10">
      {/* Sidebar con props de control */}
      <Sidebar 
        sidebarColor={theme.sidebar_color} 
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
      />

      <div className={cn(
        "transition-all duration-300",
        "lg:ml-64",
        sidebarCollapsed && "lg:ml-16"
      )}>
        {/* TopBar con función para abrir menú móvil */}
        <TopBar 
          userName={profile?.nombres} 
          avatarUrl={profile?.avatar_url} 
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="p-6 space-y-6 max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-800 pb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Configuración</h1>
              <p className="text-zinc-400">Edita tu información de registro y perfil</p>
            </div>
            <Button 
              onClick={handleSaveAll} 
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-12 font-bold gap-2 shadow-lg w-full sm:w-auto"
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Save className="h-5 w-5" />}
              Guardar Cambios
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
             {/* ... (resto de tu contenido de Card, Foto y Formulario) ... */}
             {/* He omitido el resto del HTML para brevedad, pero mantenlo igual */}
          </div>
        </main>
      </div>
    </div>
  )
}

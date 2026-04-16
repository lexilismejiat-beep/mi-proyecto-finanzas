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
  
  // --- ANEXO: ESTADOS PARA EL MENÚ ---
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
        // Traemos datos de la tabla user_profiles (donde está el registro detallado)
        const { data } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        
        // También verificamos si existe dream o avatar_url en la tabla profiles principal
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

  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = event.target.files?.[0]
      if (!file) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      
      // Actualizamos inmediatamente en el estado
      setProfile({ ...profile, avatar_url: publicUrl })
      toast.success("Imagen cargada")
    } catch (error: any) {
      toast.error("Error al subir: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Guardamos los datos personales en 'user_profiles'
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

      // 2. Guardamos la FOTO y el SUEÑO en la tabla 'profiles' (donde realmente viven)
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

      toast.success("¡Cambios guardados permanentemente!");
      
      // Opcional: Pequeña pausa antes de recargar para que el usuario vea el éxito
      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (error: any) {
      console.error("Error al guardar:", error);
      toast.error("Error: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-emerald-500" /></div>

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-10">
      {/* ANEXO: Sidebar ahora recibe los controles de estado */}
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
        {/* ANEXO: TopBar recibe la función para abrir la hamburgesa */}
        <TopBar 
          userName={profile?.nombres} 
          avatarUrl={profile?.avatar_url} 
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="p-6 space-y-6 max-w-6xl mx-auto">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Configuración</h1>
              <p className="text-zinc-400">Edita tu información de registro y perfil</p>
            </div>
            <Button 
              onClick={handleSaveAll} 
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-12 font-bold gap-2 shadow-lg shadow-emerald-900/20"
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Save className="h-5 w-5" />}
              Guardar Cambios
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* PANEL DE FOTO Y META */}
            <div className="space-y-6">
              <Card className="bg-[#121212] border-zinc-800 shadow-2xl overflow-hidden">
                <div className="h-2 w-full bg-emerald-600" />
                <CardContent className="pt-8 flex flex-col items-center">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="h-36 w-36 rounded-full border-4 border-zinc-800 overflow-hidden shadow-inner">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-zinc-900 text-3xl font-bold text-emerald-500">
                          {profile?.nombres?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="text-white h-8 w-8" />
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleUploadAvatar} className="hidden" accept="image/*" />
                  <h3 className="mt-4 text-xl font-bold text-white">{profile?.nombres} {profile?.apellidos}</h3>
                  <p className="text-zinc-500 text-sm">{profile?.cedula}</p>
                </CardContent>
              </Card>

              <Card className="bg-[#121212] border-zinc-800 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-500">
                    <Target className="h-4 w-4" /> TU GRAN SUEÑO
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 min-h-[100px] focus:border-emerald-500"
                    placeholder="¿Por qué estás ahorrando?"
                    value={profile?.dream || ""}
                    onChange={(e) => setProfile({...profile, dream: e.target.value})}
                  />
                </CardContent>
              </Card>
            </div>

            {/* PANEL DE DATOS FORMULARIO */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-[#121212] border-zinc-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <UserIcon className="h-5 w-5 text-emerald-500" /> Datos del Registro
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Nombres</Label>
                    <Input className="bg-zinc-900 border-zinc-700 text-white" value={profile?.nombres || ""} onChange={(e) => setProfile({...profile, nombres: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Apellidos</Label>
                    <Input className="bg-zinc-900 border-zinc-700 text-white" value={profile?.apellidos || ""} onChange={(e) => setProfile({...profile, apellidos: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Teléfono</Label>
                    <Input className="bg-zinc-900 border-zinc-700 text-white" value={profile?.telefono || ""} onChange={(e) => setProfile({...profile, telefono: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Género</Label>
                    <Select value={profile?.genero} onValueChange={(v) => setProfile({...profile, genero: v})}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="femenino">Femenino</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#121212] border-zinc-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <MapPin className="h-5 w-5 text-emerald-500" /> Ubicación
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Dirección</Label>
                    <Input className="bg-zinc-900 border-zinc-700 text-white" value={profile?.direccion || ""} onChange={(e) => setProfile({...profile, direccion: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Ciudad</Label>
                    <Input className="bg-zinc-900 border-zinc-700 text-white" value={profile?.ciudad || ""} onChange={(e) => setProfile({...profile, ciudad: e.target.value})} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Palette, Shield, Loader2, Save, Target, Camera } from "lucide-react"

export default function ConfiguracionPage() {
  const supabase = createClient()
  const { theme } = useThemeSettings()
  // Referencia para abrir el selector de archivos oculto
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Cargar datos reales de la base de datos
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        setProfile(data)
      }
      setLoading(false)
    }
    loadProfile()
  }, [supabase])

  // --- LÓGICA DE SUBIDA DE FOTO A SUPABASE STORAGE ---
  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = event.target.files?.[0]
      if (!file) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Preparamos el nombre del archivo (único por usuario)
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // 1. Subir al bucket 'avatars' (Debes crearlo en Supabase Storage)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Obtener la URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // 3. Actualizar el estado local (para vista previa)
      setProfile({ ...profile, avatar_url: publicUrl })
      toast.success("Foto cargada. ¡No olvides guardar los cambios definitivos!")
    } catch (error: any) {
      toast.error("Error al subir imagen: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  // --- FUNCIÓN MAESTRA: GUARDAR CAMBIOS REALES EN SUPABASE ---
  const handleSaveAll = async () => {
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error("No se encontró sesión de usuario")
      setIsSaving(false)
      return
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        // GUARDAMOS LOS DATOS CLAVE
        avatar_url: profile.avatar_url, 
        dream: profile.dream, 
        primary_color: theme.primary_color,
        sidebar_color: theme.sidebar_color,
        text_color: theme.text_color,
        background_image: theme.background_image,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) {
      toast.error("Error al guardar: " + error.message)
    } else {
      toast.success("¡Identidad y perfil guardados permanentemente!")
    }
    setIsSaving(false)
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="min-h-screen bg-background">
      <Sidebar sidebarColor={theme.sidebar_color} />
      
      <div className="lg:ml-64 transition-all duration-300">
        <TopBar userName={profile?.full_name} avatarUrl={profile?.avatar_url} />

        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Configuración de Perfil</h1>
              <p className="text-muted-foreground">Personaliza tu identidad y tus metas financieras</p>
            </div>
            
            <Button 
              onClick={handleSaveAll} 
              disabled={isSaving}
              className="gap-2 shadow-lg text-white"
              style={{ backgroundColor: theme.primary_color }}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar Configuración
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* 1. SECCIÓN NUEVA: FOTO DE PERFIL CAMBIABLE */}
            <Card className="lg:col-span-1 flex flex-col items-center justify-center p-6 text-center shadow-lg">
                <CardHeader>
                    <CardTitle className="text-sm font-bold opacity-60">Foto de Perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="h-32 w-32 rounded-full border-4 shadow-xl overflow-hidden" style={{ borderColor: theme.sidebar_color || "#F1F5F9" }}>
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center font-bold text-4xl text-white" style={{ backgroundColor: theme.primary_color }}>
                                {profile?.full_name?.charAt(0)}
                            </div>
                        )}
                    </div>
                    {/* Overlay para editar */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        {uploading ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : <Camera className="h-8 w-8 text-white" />}
                    </div>
                  </div>
                  {/* Selector de archivos oculto */}
                  <input type="file" ref={fileInputRef} onChange={handleUploadAvatar} accept="image/*" className="hidden" />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="text-[11px] gap-1.5 h-8">
                     <Camera className="h-3.5 w-3.5" /> Cambiar foto
                  </Button>
                </CardContent>
            </Card>

            {/* Sección Información Personal (Ocupa 2 columnas) */}
            <Card className="lg:col-span-2 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-blue-500" /> Datos Personales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Nombre Completo</Label>
                        <Input value={profile?.full_name || ""} onChange={(e) => setProfile({...profile, full_name: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Email (No editable)</Label>
                        <Input value={profile?.email || ""} disabled className="opacity-50" />
                    </div>
                </div>

                {/* SECCIÓN NUEVA: MI SUEÑO FINANCIERO */}
                <div className="grid gap-2 pt-4">
                  <Label className="flex items-center gap-2">
                     <Target className="h-4 w-4" style={{ color: theme.primary_color }} />
                     Tu Gran Sueño Financiero (¿Por qué estás ahorrando?)
                  </Label>
                  <Textarea 
                    placeholder="Ej. Comprar mi casa propia, mi moto, viajar con mi familia..."
                    value={profile?.dream || ""}
                    onChange={(e) => setProfile({...profile, dream: e.target.value})}
                    className="min-h-[100px] resize-none"
                  />
                  <p className="text-[10px] italic opacity-50">* Esto se mostrará en tu tarjeta de identidad del Dashboard.</p>
                </div>
              </CardContent>
            </Card>

            {/* Sección de Apariencia */}
            <Card className="lg:col-span-3 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-purple-500" /> Resumen de Apariencia</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-4 border rounded-xl bg-slate-50">
                  <span className="font-medium">Color Primario</span>
                  <div className="h-8 w-16 rounded-lg shadow-sm" style={{ backgroundColor: theme.primary_color }} />
                </div>
                <div className="flex justify-between items-center p-4 border rounded-xl bg-slate-50">
                  <span className="font-medium">Menú Lateral</span>
                  <div className="h-8 w-16 rounded-lg shadow-sm" style={{ backgroundColor: theme.sidebar_color }} />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

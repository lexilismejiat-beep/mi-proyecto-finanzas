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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Save, Target, Camera, MapPin, User as UserIcon } from "lucide-react"

export default function ConfiguracionPage() {
  const supabase = createClient()
  const { theme } = useThemeSettings()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // 1. CARGAR DATOS DESDE USER_PROFILES
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        
        if (data) setProfile(data)
      }
      setLoading(false)
    }
    loadProfile()
  }, [supabase])

  // 2. LÓGICA DE SUBIDA DE FOTO
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

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setProfile({ ...profile, avatar_url: publicUrl })
      toast.success("Foto cargada con éxito")
    } catch (error: any) {
      toast.error("Error al subir imagen: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  // 3. GUARDAR TODOS LOS CAMBIOS
  const handleSaveAll = async () => {
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // Eliminamos campos que no deben ir en el update si existen
    const { id, created_at, email, ...updateData } = profile

    const { error } = await supabase
      .from("user_profiles")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) {
      toast.error("Error al guardar: " + error.message)
    } else {
      toast.success("¡Información actualizada correctamente!")
      // Refrescamos para asegurar que el Dashboard vea los cambios
      setTimeout(() => window.location.reload(), 1000)
    }
    setIsSaving(false)
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
      <Loader2 className="animate-spin text-emerald-500" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-10">
      <Sidebar sidebarColor={theme.sidebar_color} />
      
      <div className="lg:ml-64 transition-all duration-300">
        <TopBar userName={profile?.nombres} avatarUrl={profile?.avatar_url} />

        <main className="p-6 space-y-6 max-w-6xl mx-auto">
          {/* CABECERA CON BOTÓN VERDE */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Configuración de Perfil</h1>
              <p className="text-gray-400 text-sm">Personaliza tu identidad y tus metas financieras</p>
            </div>
            
            <Button 
              onClick={handleSaveAll} 
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 shadow-lg shadow-emerald-900/20 gap-2 transition-all active:scale-95"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar Configuración
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* COLUMNA IZQUIERDA: FOTO Y SUEÑO */}
            <div className="space-y-6">
              <Card className="bg-[#121212] border-zinc-800 text-white shadow-xl overflow-hidden">
                <div className="h-2 w-full bg-emerald-600" />
                <CardContent className="pt-8 flex flex-col items-center">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="h-32 w-32 rounded-full border-4 border-zinc-800 overflow-hidden shadow-2xl transition-transform group-hover:scale-105">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-zinc-800 text-4xl font-bold text-emerald-500">
                          {profile?.nombres?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      {uploading ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : <Camera className="h-8 w-8 text-white" />}
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleUploadAvatar} accept="image/*" className="hidden" />
                  <h3 className="mt-4 text-lg font-bold">{profile?.nombres} {profile?.apellidos}</h3>
                  <p className="text-xs text-zinc-500 lowercase">{profile?.genero || "Usuario"}</p>
                </CardContent>
              </Card>

              <Card className="bg-[#121212] border-zinc-800 text-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-500" /> MI META FINANCIERA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    placeholder="¿Cuál es tu gran sueño? (Ej: Comprar mi primera casa)"
                    className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 min-h-[120px] focus:border-emerald-500 focus:ring-emerald-500"
                    value={profile?.dream || ""}
                    onChange={(e) => setProfile({...profile, dream: e.target.value})}
                  />
                </CardContent>
              </Card>
            </div>

            {/* COLUMNA DERECHA: DATOS PERSONALES (REGISTRO) */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-[#121212] border-zinc-800 text-white shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-md">
                    <UserIcon className="h-5 w-5 text-emerald-500" /> Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Nombres</Label>
                      <Input className="bg-zinc-900 border-zinc-700 text-white" value={profile?.nombres || ""} onChange={(e) => setProfile({...profile, nombres: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Apellidos</Label>
                      <Input className="bg-zinc-900 border-zinc-700 text-white" value={profile?.apellidos || ""} onChange={(e) => setProfile({...profile, apellidos: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Cédula / Documento</Label>
                      <Input className="bg-zinc-900 border-zinc-700 text-white" value={profile?.cedula || ""} onChange={(e) => setProfile({...profile, cedula: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Teléfono</Label>
                      <Input className="bg-zinc-900 border-zinc-700 text-white" value={profile?.telefono || ""} onChange={(e) => setProfile({...profile, telefono: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Género</Label>
                      <Select value={profile?.genero} onValueChange={(v) => setProfile({...profile, genero: v})}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="femenino">Femenino</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Fecha de Nacimiento</Label>
                      <Input type="date" className="bg-zinc-900 border-zinc-700 text-white" value={profile?.fecha_nacimiento || ""} onChange={(e) => setProfile({...profile, fecha_nacimiento: e.target.value})} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#121212] border-zinc-800 text-white shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-md">
                    <MapPin className="h-5 w-5 text-emerald-500" /> Ubicación
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Dirección</Label>
                    <Input className="bg-zinc-900 border-zinc-700 text-white" value={profile?.direccion || ""} onChange={(e) => setProfile({...profile, direccion: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Ciudad</Label>
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

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
import { Palette, Shield, Loader2, Save, Target, Camera, MapPin, Phone, User as UserIcon } from "lucide-react"

export default function ConfiguracionPage() {
  const supabase = createClient()
  const { theme } = useThemeSettings()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Consultamos la tabla user_profiles que es la que usas en el registro
        const { data } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        setProfile(data)
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
      setProfile({ ...profile, avatar_url: publicUrl })
      toast.success("Vista previa de foto lista")
    } catch (error: any) {
      toast.error("Error al subir: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSaveAll = async () => {
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from("user_profiles")
      .update({
        ...profile, // Esto incluye nombres, apellidos, cedula, telefono, fecha_nacimiento, genero, direccion, ciudad, pais, dream y avatar_url
        primary_color: theme.primary_color,
        sidebar_color: theme.sidebar_color,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user?.id)

    if (error) toast.error("Error: " + error.message)
    else toast.success("¡Toda tu información ha sido actualizada!")
    setIsSaving(false)
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="min-h-screen bg-background pb-10">
      <Sidebar sidebarColor={theme.sidebar_color} />
      
      <div className="lg:ml-64 transition-all duration-300">
        <TopBar userName={`${profile?.nombres} ${profile?.apellidos}`} avatarUrl={profile?.avatar_url} />

        <main className="p-6 space-y-6 max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Configuración de Cuenta</h1>
              <p className="text-muted-foreground text-sm">Gestiona tu identidad y preferencias del sistema</p>
            </div>
            <Button onClick={handleSaveAll} disabled={isSaving} style={{ backgroundColor: theme.primary_color }} className="text-white gap-2 shadow-md">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar Cambios
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* COLUMNA IZQUIERDA: FOTO Y SUEÑO */}
            <div className="space-y-6">
              <Card className="text-center p-6 shadow-sm border-none bg-card/50 backdrop-blur">
                <div className="relative mx-auto h-32 w-32 mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="h-full w-full rounded-full border-4 overflow-hidden shadow-inner" style={{ borderColor: theme.primary_color }}>
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-muted text-2xl font-bold">
                        {profile?.nombres?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white h-6 w-6" />
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleUploadAvatar} className="hidden" accept="image/*" />
                </div>
                <h3 className="font-bold text-lg">{profile?.nombres} {profile?.apellidos}</h3>
                <p className="text-xs text-muted-foreground mb-4 italic">{profile?.email}</p>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="w-full text-xs">
                   {uploading ? "Subiendo..." : "Cambiar Foto de Perfil"}
                </Button>
              </Card>

              <Card className="border-t-4 shadow-sm" style={{ borderTopColor: theme.primary_color }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" /> Meta Financiera</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    placeholder="¿Por qué ahorras? (Casa, moto, viaje...)" 
                    value={profile?.dream || ""} 
                    onChange={(e) => setProfile({...profile, dream: e.target.value})}
                    className="min-h-[120px] text-sm resize-none"
                  />
                </CardContent>
              </Card>
            </div>

            {/* COLUMNA DERECHA: DATOS DEL REGISTRO */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-sm border-none">
                <CardHeader>
                  <CardTitle className="text-md flex items-center gap-2"><UserIcon className="h-4 w-4" /> Información Personal</CardTitle>
                  <CardDescription>Datos básicos proporcionados en el registro</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombres</Label>
                    <Input value={profile?.nombres || ""} onChange={(e) => setProfile({...profile, nombres: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Apellidos</Label>
                    <Input value={profile?.apellidos || ""} onChange={(e) => setProfile({...profile, apellidos: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cédula / ID</Label>
                    <Input value={profile?.cedula || ""} onChange={(e) => setProfile({...profile, cedula: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input value={profile?.telefono || ""} onChange={(e) => setProfile({...profile, telefono: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Género</Label>
                    <Select value={profile?.genero} onValueChange={(v) => setProfile({...profile, genero: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="femenino">Femenino</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Nacimiento</Label>
                    <Input type="date" value={profile?.fecha_nacimiento || ""} onChange={(e) => setProfile({...profile, fecha_nacimiento: e.target.value})} />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-none">
                <CardHeader>
                  <CardTitle className="text-md flex items-center gap-2"><MapPin className="h-4 w-4" /> Ubicación</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label>Dirección</Label>
                    <Input value={profile?.direccion || ""} onChange={(e) => setProfile({...profile, direccion: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Ciudad</Label>
                    <Input value={profile?.ciudad || ""} onChange={(e) => setProfile({...profile, ciudad: e.target.value})} />
                  </div>
                </CardContent>
              </Card>

              {/* APARIENCIA */}
              <Card className="shadow-sm border-none bg-slate-50/50">
                <CardHeader>
                  <CardTitle className="text-md flex items-center gap-2"><Palette className="h-4 w-4" /> Apariencia del Sistema</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border flex-1 min-w-[200px]">
                    <div className="h-6 w-6 rounded-full" style={{ backgroundColor: theme.primary_color }} />
                    <span className="text-sm font-medium">Color Primario Activo</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border flex-1 min-w-[200px]">
                    <div className="h-6 w-6 rounded-full" style={{ backgroundColor: theme.sidebar_color }} />
                    <span className="text-sm font-medium">Menú Lateral Activo</span>
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

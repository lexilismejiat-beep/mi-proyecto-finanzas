"use client"

import { useState, useEffect, useRef } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { CedulaSection } from "@/components/dashboard/cedula-section"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Bell, Shield, Palette, Globe, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

// Integración con tu Backend y Temas
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"

const PRESET_THEMES = [
  { name: "Esmeralda", primary: "#10B981", sidebar: "#1f2937", text: "#ffffff" },
  { name: "Océano Azul", primary: "#3b82f6", sidebar: "#0f172a", text: "#ffffff" },
  { name: "Atardecer", primary: "#f59e0b", sidebar: "#451a03", text: "#ffffff" },
  { name: "Rosa Moderno", primary: "#ec4899", sidebar: "#2d0612", text: "#ffffff" },
  { name: "Noche Oscura", primary: "#6366f1", sidebar: "#000000", text: "#ffffff" },
  { name: "Minimalista", primary: "#111827", sidebar: "#f3f4f6", text: "#111827" },
]

export default function ConfiguracionPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const { theme, updateTheme } = useThemeSettings()

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
    alerts: true,
  })

  // Cargar perfil al inicio
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from("profiles") 
        .select("*")
        .eq("id", user.id)
        .single()
      
      if (profileData) setProfile(profileData)
    }
    fetchProfile()
  }, [supabase])

  // --- LOGICA DE GUARDADO DE TEMA ---
  const handleApplyTheme = async (themeData: any) => {
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Debes iniciar sesión")
      setIsSaving(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        primary_color: themeData.primary,
        sidebar_color: themeData.sidebar,
        text_color: themeData.text,
        theme_name: themeData.name
      })
      .eq('id', user.id)

    if (!error) {
      updateTheme({
        primary_color: themeData.primary,
        sidebar_color: themeData.sidebar,
        text_color: themeData.text
      })
      toast.success(`Tema ${themeData.name} guardado en tu perfil`)
    } else {
      toast.error("Error al guardar en la base de datos")
      console.error(error)
    }
    setIsSaving(false)
  }

  // --- LOGICA DE SUBIDA DE IMAGEN (AVATAR) ---
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = event.target.files?.[0]
      if (!file) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // 1. Subir al Storage (Bucket 'avatars')
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Obtener URL Publica
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // 3. Actualizar tabla Profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfile({ ...profile, avatar_url: publicUrl })
      toast.success("Foto de perfil actualizada")
    } catch (error: any) {
      toast.error("Error al subir imagen")
      console.error(error.message)
    } finally {
      setUploading(false)
    }
  }

  const fullName = profile?.full_name || "Usuario"
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
        sidebarColor={theme.sidebar_color}
      />

      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar userName={fullName} avatarUrl={profile?.avatar_url} onMenuClick={() => setMobileSidebarOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold" style={{ color: theme.text_color }}>Configuración</h1>
            <p className="text-muted-foreground">Administra tu cuenta y preferencias</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            
            {/* SECCIÓN: Apariencia */}
            <Card className="border-border bg-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: theme.text_color }}>
                  <Palette className="h-5 w-5 text-primary" />
                  Personalizar Apariencia
                </CardTitle>
                <CardDescription>Selecciona un tema para guardar en tu base de datos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PRESET_THEMES.map((t) => (
                    <button
                      key={t.name}
                      onClick={() => handleApplyTheme(t)}
                      disabled={isSaving}
                      className={cn(
                        "group relative flex flex-col gap-2 rounded-xl border p-4 transition-all hover:ring-2 hover:ring-primary/50",
                        theme.sidebar_color === t.sidebar ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-muted/30"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{t.name}</span>
                        {(theme.sidebar_color === t.sidebar && !isSaving) && <Check className="h-4 w-4 text-primary" />}
                        {isSaving && theme.sidebar_color === t.sidebar && <Loader2 className="h-4 w-4 animate-spin" />}
                      </div>
                      <div className="flex gap-2">
                        <div className="h-6 w-6 rounded-full" style={{ backgroundColor: t.primary }} />
                        <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: t.sidebar }} />
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Perfil */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: theme.text_color }}>
                  <Shield className="h-5 w-5 text-primary" />
                  Perfil
                </CardTitle>
                <CardDescription>Actualiza tu información personal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-2 border-border">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-muted text-xl">{initials}</AvatarFallback>
                    </Avatar>
                    
                    {/* Input de archivo oculto */}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110 disabled:opacity-50"
                      style={{ backgroundColor: theme.primary_color }}
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </button>
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-lg">{fullName}</p>
                    <p className="text-sm text-muted-foreground">{profile?.email || "Cargando..."}</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Nombre completo</Label>
                    <Input defaultValue={fullName} className="bg-muted/50" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Correo electrónico</Label>
                    <Input defaultValue={profile?.email} disabled className="bg-muted/50 opacity-70" />
                  </div>
                </div>

                <Button className="w-full sm:w-auto" style={{ backgroundColor: theme.primary_color }}>
                  Guardar cambios
                </Button>
              </CardContent>
            </Card>

            <CedulaSection />
            
          </div>
        </main>
      </div>
    </div>
  )
}

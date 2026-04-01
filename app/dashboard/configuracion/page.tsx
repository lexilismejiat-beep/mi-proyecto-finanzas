"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Palette, Shield, Loader2, Save } from "lucide-react"

export default function ConfiguracionPage() {
  const supabase = createClient()
  const { theme, updateTheme } = useThemeSettings()
  
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

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
  }, [])

  // FUNCIÓN MAESTRA: GUARDAR CAMBIOS EN SUPABASE
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
      toast.success("¡Configuración guardada permanentemente!")
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
              <p className="text-muted-foreground">Personaliza tu experiencia y datos personales</p>
            </div>
            
            {/* BOTÓN DE GUARDAR GLOBAL */}
            <Button 
              onClick={handleSaveAll} 
              disabled={isSaving}
              className="gap-2 shadow-lg"
              style={{ backgroundColor: theme.primary_color }}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar Cambios Reales
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Sección Información Personal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Datos del Perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Nombre Completo</Label>
                  <Input 
                    value={profile?.full_name || ""} 
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Email (No editable)</Label>
                  <Input value={profile?.email || ""} disabled className="opacity-50" />
                </div>
              </CardContent>
            </Card>

            {/* Sección de Resumen de Apariencia Actual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Apariencia Activa</CardTitle>
                <CardDescription>Colores que se guardarán en tu perfil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <span>Color Primario</span>
                  <div className="h-6 w-12 rounded" style={{ backgroundColor: theme.primary_color }} />
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <span>Menú Lateral</span>
                  <div className="h-6 w-12 rounded" style={{ backgroundColor: theme.sidebar_color }} />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

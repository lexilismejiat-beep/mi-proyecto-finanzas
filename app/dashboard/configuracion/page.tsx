"use client"

import { useState, useEffect } from "react"
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
import { Camera, Bell, Shield, Palette, Globe } from "lucide-react"

// Integración con tu Backend y Temas
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"

export default function ConfiguracionPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  
  const supabase = createClient()
  const { theme } = useThemeSettings()

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
    alerts: true,
  })

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from("profiles") 
        .select("*")
        .eq("id", user.id)
        .single()
      
      setProfile(profileData)
    }
    fetchProfile()
  }, [supabase])

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

      <div
        className={cn(
          "transition-all duration-300",
          "lg:ml-64",
          sidebarCollapsed && "lg:ml-16"
        )}
      >
        <TopBar 
          userName={fullName} 
          avatarUrl={profile?.avatar_url}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold" style={{ color: theme.text_color }}>Configuración</h1>
            <p className="text-muted-foreground">Administra tu cuenta y preferencias</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Perfil - Forzado a modo oscuro con clases de Shadcn */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: theme.text_color }}>
                  <Shield className="h-5 w-5 text-primary" />
                  Perfil
                </CardTitle>
                <CardDescription className="text-muted-foreground">Actualiza tu información personal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-2 border-border">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-muted text-xl">{initials}</AvatarFallback>
                    </Avatar>
                    <button 
                      className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110"
                      style={{ backgroundColor: theme.primary_color }}
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-lg">{fullName}</p>
                    <p className="text-sm text-muted-foreground">{profile?.email || "Cargando datos..."}</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-foreground">Nombre completo</Label>
                    <Input id="name" defaultValue={fullName} className="bg-muted/50 border-border text-foreground focus:ring-primary" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-foreground">Correo electrónico</Label>
                    <Input id="email" type="email" defaultValue={profile?.email} className="bg-muted/50 border-border text-foreground" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone" className="text-foreground">Teléfono</Label>
                    <Input id="phone" type="tel" placeholder="+57 ..." className="bg-muted/50 border-border text-foreground" />
                  </div>
                </div>

                <Button className="w-full sm:w-auto" style={{ backgroundColor: theme.primary_color }}>
                  Guardar cambios
                </Button>
              </CardContent>
            </Card>

            {/* Telegram Link Section */}
            <CedulaSection />

            {/* Notificaciones */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: theme.text_color }}>
                  <Bell className="h-5 w-5 text-primary" />
                  Notificaciones
                </CardTitle>
                <CardDescription className="text-muted-foreground">Configura tus alertas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { id: 'email', label: 'Notificaciones por email', desc: 'Resúmenes periódicos' },
                  { id: 'push', label: 'Notificaciones push', desc: 'Alertas inmediatas' },
                  { id: 'weekly', label: 'Resumen semanal', desc: 'Reporte de gastos lunes' },
                  { id: 'alerts', label: 'Alertas de gastos', desc: 'Control de presupuestos' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch 
                      checked={(notifications as any)[item.id]} 
                      onCheckedChange={(checked) => setNotifications({ ...notifications, [item.id]: checked })}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Preferencias */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: theme.text_color }}>
                  <Globe className="h-5 w-5 text-primary" />
                  Preferencias
                </CardTitle>
                <CardDescription className="text-muted-foreground">Idioma y moneda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-foreground">Moneda</Label>
                  <select className="w-full h-10 px-3 rounded-md border border-border bg-muted/50 text-foreground text-sm focus:ring-2 focus:ring-primary outline-none">
                    <option value="COP">Peso Colombiano (COP)</option>
                    <option value="USD">Dólar (USD)</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-foreground">Zona horaria</Label>
                  <select className="w-full h-10 px-3 rounded-md border border-border bg-muted/50 text-foreground text-sm focus:ring-2 focus:ring-primary outline-none">
                    <option value="bogota">Bogotá (GMT-5)</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

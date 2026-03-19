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

// Importaciones necesarias para la data real
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"

export default function ConfiguracionPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()
  const { theme } = useThemeSettings()

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
    alerts: true,
  })

  // Cargar datos reales del perfil al montar la página
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Nota: Aquí uso "profiles" porque es la tabla que vimos en tus capturas de Supabase
      const { data: profileData } = await supabase
        .from("profiles") 
        .select("*")
        .eq("id", user.id)
        .single()
      
      setProfile(profileData)
      setLoading(false)
    }
    fetchProfile()
  }, [supabase])

  // Función para manejar el nombre mostrado
  const fullName = profile ? profile.full_name : "Usuario"
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
        sidebarColor={theme.sidebar_color} // Aplicamos color de tema como en transacciones
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
            {/* Profile Section */}
            <Card style={{ backgroundColor: theme.card_color }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: theme.text_color }}>
                  <Shield className="h-5 w-5" />
                  Perfil
                </CardTitle>
                <CardDescription>Actualiza tu información personal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                    </Avatar>
                    <button 
                      className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: theme.primary_color }}
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: theme.text_color }}>{fullName}</p>
                    <p className="text-sm text-muted-foreground">{profile?.email || "cargando..."}</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" style={{ color: theme.text_color }}>Nombre completo</Label>
                    <Input id="name" defaultValue={fullName} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email" style={{ color: theme.text_color }}>Correo electrónico</Label>
                    <Input id="email" type="email" defaultValue={profile?.email} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone" style={{ color: theme.text_color }}>Teléfono</Label>
                    <Input id="phone" type="tel" defaultValue={profile?.phone || ""} />
                  </div>
                </div>

                <Button style={{ backgroundColor: theme.primary_color }}>
                  Guardar cambios
                </Button>
              </CardContent>
            </Card>

            {/* Telegram Link Section - El componente que ya tienes creado */}
            <CedulaSection />

            {/* Notifications */}
            <Card style={{ backgroundColor: theme.card_color }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: theme.text_color }}>
                  <Bell className="h-5 w-5" />
                  Notificaciones
                </CardTitle>
                <CardDescription>Configura cómo quieres recibir alertas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { id: 'email', label: 'Notificaciones por email', desc: 'Recibe resúmenes por correo' },
                  { id: 'push', label: 'Notificaciones push', desc: 'Alertas en tiempo real' },
                  { id: 'weekly', label: 'Resumen semanal', desc: 'Recibe un reporte cada lunes' },
                  { id: 'alerts', label: 'Alertas de gastos', desc: 'Cuando superes tu presupuesto' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium" style={{ color: theme.text_color }}>{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch 
                      checked={(notifications as any)[item.id]} 
                      onCheckedChange={(checked) => setNotifications({ ...notifications, [item.id]: checked })}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card style={{ backgroundColor: theme.card_color }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: theme.text_color }}>
                  <Globe className="h-5 w-5" />
                  Preferencias
                </CardTitle>
                <CardDescription>Personaliza tu experiencia</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="currency" style={{ color: theme.text_color }}>Moneda predeterminada</Label>
                  <select 
                    id="currency"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                    defaultValue="COP"
                  >
                    <option value="COP">Peso Colombiano (COP)</option>
                    <option value="USD">Dólar Estadounidense (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
                {/* ... Resto de los selects de idioma y timezone ... */}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

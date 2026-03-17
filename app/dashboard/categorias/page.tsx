"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { 
  Calendar as CalendarIcon, Tag, Utensils, Briefcase, 
  ShoppingCart, Check, X, ArrowRight, Car, Heart, 
  Gamepad2, GraduationCap, Home, Wallet 
} from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"

// Mapa de iconos inteligente según el nombre de la categoría
const ICON_MAP: Record<string, any> = {
  "Alimentación": ShoppingCart,
  "Restaurantes": Utensils,
  "Salario": Briefcase,
  "Nomina": Briefcase,
  "Transporte": Car,
  "Salud": Heart,
  "Entretenimiento": Gamepad2,
  "Educación": GraduationCap,
  "Vivienda": Home,
  "Freelance": Wallet,
  "Otros": Tag
}

export default function CategoriasPage() {
  const supabase = createClient()
  const { theme } = useThemeSettings()
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)

  const [range, setRange] = useState({ 
    from: startOfMonth(new Date()), 
    to: endOfMonth(new Date()) 
  })

  // 1. Obtener perfil del usuario (Igual que en Transacciones)
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      setProfile(profileData)
    }
    fetchProfile()
  }, [supabase])

  // 2. Obtener transacciones filtradas por cédula y fecha
  useEffect(() => {
    if (!profile?.cedula) return

    async function fetchTransactions() {
      setLoading(true)
      const { data } = await supabase
        .from('transacciones')
        .select('*')
        .eq('cedula', profile.cedula) // Filtro por usuario
        .gte('created_at', range.from.toISOString())
        .lte('created_at', range.to.toISOString())
      
      if (data) setTransactions(data)
      setLoading(false)
    }
    fetchTransactions()
  }, [range, supabase, profile])

  const stats = useMemo(() => {
    const agrupado: Record<string, any> = {}
    transactions.forEach((t: any) => {
      const cat = t.categoria || "Otros"
      if (!agrupado[cat]) {
        agrupado[cat] = { 
          nombre: cat, 
          total: 0, 
          count: 0, 
          type: t.monto >= 0 ? 'income' : 'expense' 
        }
      }
      agrupado[cat].total += Math.abs(t.monto)
      agrupado[cat].count += 1
    })
    return Object.values(agrupado).sort((a: any, b: any) => b.total - a.total)
  }, [transactions])

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(val)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onCollapsedChange={setSidebarCollapsed} 
        mobileOpen={mobileSidebarOpen} 
        onMobileOpenChange={setMobileSidebarOpen}
        sidebarColor={theme.sidebar_color}
      />
      
      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar 
          userName={profile ? `${profile.nombres} ${profile.apellidos}` : "Usuario"} 
          avatarUrl={profile?.avatar_url}
          onMenuClick={() => setMobileSidebarOpen(true)} 
        />
        
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.text_color }}>Análisis por Categoría</h1>
              <p className="text-muted-foreground">Gastos e ingresos de {profile?.nombres || 'tu cuenta'}</p>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 bg-card border-white/10">
                  <CalendarIcon className="h-4 w-4" style={{ color: theme.primary_color }} />
                  {format(range.from, "dd MMM")} - {format(range.to, "dd MMM, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={range as any}
                  onSelect={(r: any) => r?.from && r?.to && setRange(r)}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: theme.primary_color }}></div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {stats.map((cat: any) => {
                const Icon = ICON_MAP[cat.nombre] || Tag
                return (
                  <Card 
                    key={cat.nombre} 
                    style={{ backgroundColor: theme.card_color }}
                    className={cn(
                      "cursor-pointer hover:opacity-80 transition-all border-white/5",
                      selectedCategory === cat.nombre && "ring-2"
                    )}
                    //@ts-ignore
                    style={{ ... (selectedCategory === cat.nombre && { ringColor: theme.primary_color }), backgroundColor: theme.card_color }}
                    onClick={() => setSelectedCategory(selectedCategory === cat.nombre ? null : cat.nombre)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.primary_color}20`, color: theme.primary_color }}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <ArrowRight className={cn("h-4 w-4 transition-transform", selectedCategory === cat.nombre && "rotate-90")} />
                      </div>
                      <h3 className="font-bold text-lg" style={{ color: theme.text_color }}>{cat.nombre}</h3>
                      <p className="text-2xl font-bold" style={{ color: cat.type === 'income' ? '#10b981' : theme.text_color }}>
                        {formatCurrency(cat.total)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">{cat.count} movimientos en este periodo</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {selectedCategory && (
            <Card className="mt-8 border-white/10 bg-card/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <div className="p-4 border-b border-white/5 flex justify-between items-center" style={{ backgroundColor: `${theme.primary_color}10` }}>
                <h2 className="font-bold" style={{ color: theme.primary_color }}>Movimientos en {selectedCategory}</h2>
                <Button variant="ghost" size="icon" onClick={() => setSelectedCategory(null)}><X className="h-4 w-4"/></Button>
              </div>
              <div className="divide-y divide-white/5">
                {transactions.filter((t: any) => (t.categoria || "Otros") === selectedCategory).map((t: any) => (
                  <div key={t.id} className="p-4 flex justify-between hover:bg-white/5 transition-colors">
                    <div>
                      <p className="font-medium" style={{ color: theme.text_color }}>{t.descripcion || "Sin descripción"}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(t.created_at), "dd/MM/yyyy")}</p>
                    </div>
                    <span className={cn("font-bold", t.monto >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {formatCurrency(t.monto)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}

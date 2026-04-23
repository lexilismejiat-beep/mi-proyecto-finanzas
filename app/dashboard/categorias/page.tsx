"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Plus, Wallet, Car, Utensils, Zap, Heart, CreditCard, 
  ShoppingBag, ChevronDown, ChevronUp, Calendar as CalendarIcon,
  Trash2, Loader2, Star, Coffee, Gamepad2, Tv
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useThemeSettings } from "@/lib/theme-context"
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"
import { toast } from "sonner"

// Diccionario de iconos disponibles para elegir
const ICON_OPTIONS = [
  { id: "Utensils", icon: Utensils, label: "Comida" },
  { id: "Car", icon: Car, label: "Transporte" },
  { id: "Zap", icon: Zap, label: "Servicios" },
  { id: "Heart", icon: Heart, label: "Salud" },
  { id: "CreditCard", icon: CreditCard, label: "Bancos" },
  { id: "ShoppingBag", icon: ShoppingBag, label: "Compras" },
  { id: "Wallet", icon: Wallet, label: "Ahorro" },
  { id: "Coffee", icon: Coffee, label: "Café/Bar" },
  { id: "Gamepad2", icon: Gamepad2, label: "Juegos" },
  { id: "Tv", icon: Tv, label: "Streaming" },
  { id: "Star", icon: Star, label: "Otros" },
]

export default function CategoriasPage() {
  const supabase = createClient()
  const { theme } = useThemeSettings()
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [grupos, setGrupos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false) // Control de cierre del modal

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedIcon, setSelectedIcon] = useState("ShoppingBag")

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()
      if (!profileData) return
      setProfile(profileData)

      const { data: catUser } = await supabase.from("categorias_personalizadas").select("*").eq("user_id", profileData.cedula)

      const dateFrom = startOfMonth(new Date(selectedYear, selectedMonth))
      const dateTo = endOfMonth(new Date(selectedYear, selectedMonth))
      
      const { data: transData } = await supabase
        .from("transacciones")
        .select("categoria, monto, created_at")
        .eq("user_id", profileData.cedula)
        .gte("created_at", startOfDay(dateFrom).toISOString())
        .lte("created_at", endOfDay(dateTo).toISOString())

      const mapping: Record<string, any> = {}
      
      // Inicializar categorías del usuario
      catUser?.forEach(cat => {
        mapping[cat.nombre] = { 
          ...cat, 
          icon: ICON_OPTIONS.find(i => i.id === cat.icon_name)?.icon || ShoppingBag, 
          total: 0, 
          desglose: {} 
        }
      })

      // Categoría por defecto
      mapping["Otros"] = { nombre: "Otros", icon: Star, desc: "Gastos sin clasificar", total: 0, desglose: {}, keywords: [] }

      // Clasificación lógica
      transData?.forEach(t => {
        const catLower = t.categoria?.toLowerCase() || ""
        let asignado = false

        for (const nombreGrupo in mapping) {
          const catDef = mapping[nombreGrupo]
          if (catDef.keywords?.some((k: string) => catLower.includes(k.toLowerCase()))) {
            mapping[nombreGrupo].total += t.monto
            mapping[nombreGrupo].desglose[t.categoria] = (mapping[nombreGrupo].desglose[t.categoria] || 0) + t.monto
            asignado = true
            break
          }
        }

        if (!asignado) {
          mapping["Otros"].total += t.monto
          mapping["Otros"].desglose[t.categoria || "Sin etiqueta"] = (mapping["Otros"].desglose[t.categoria || "Sin etiqueta"] || 0) + t.monto
        }
      })

      setGrupos(Object.values(mapping))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [selectedMonth, selectedYear])

  const handleCreateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsAdding(true)
    const formData = new FormData(e.currentTarget)
    
    const newCat = {
      user_id: profile.cedula,
      nombre: formData.get("nombre"),
      descripcion: formData.get("descripcion"),
      icon_name: selectedIcon,
      keywords: (formData.get("keywords") as string).split(",").map(k => k.trim())
    }

    const { error } = await supabase.from("categorias_personalizadas").insert([newCat])
    
    if (error) {
      toast.error("Error al crear")
    } else {
      toast.success("Categoría maestra guardada")
      setIsDialogOpen(false) // 1. Cierre automático aquí
      fetchData()
    }
    setIsAdding(false)
  }

  const deleteCategory = async (id: string) => {
    if (!confirm("¿Eliminar categoría?")) return
    const { error } = await supabase.from("categorias_personalizadas").delete().eq('id', id)
    if (!error) { toast.success("Eliminada"); fetchData(); }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} />

      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar userName={profile?.nombres || "Usuario"} avatarUrl={profile?.avatar_url} onMenuClick={() => setMobileSidebarOpen(true)} />

        <main className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight">Mis Categorías</h1>
              <p className="text-gray-400">Personaliza la organización automática de tus gastos.</p>
            </div>

            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2 rounded-xl">
                <CalendarIcon className="h-4 w-4 text-emerald-500 ml-1" />
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-transparent text-sm font-bold outline-none cursor-pointer">
                  {new Array(12).fill(0).map((_, i) => (
                    <option key={i} value={i} className="bg-zinc-900">{new Intl.DateTimeFormat('es', {month: 'long'}).format(new Date(0, i))}</option>
                  ))}
                </select>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold">
                    <Plus size={18} /> Nueva
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#121212] border-white/10 text-white sm:max-w-[450px]">
                  <DialogHeader><DialogTitle className="text-xl font-bold">Nueva Categoría Maestra</DialogTitle></DialogHeader>
                  <form onSubmit={handleCreateCategory} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Nombre</Label>
                      <Input name="nombre" placeholder="Ej: Entretenimiento" className="bg-white/5 border-white/10" required />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Palabras Clave (separadas por coma)</Label>
                      <Input name="keywords" placeholder="netflix, cine, spotify" className="bg-white/5 border-white/10" required />
                    </div>

                    <div className="space-y-3">
                      <Label>Selecciona un Icono</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {ICON_OPTIONS.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedIcon(item.id)}
                            className={cn(
                              "p-3 rounded-xl border transition-all flex items-center justify-center",
                              selectedIcon === item.id 
                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" 
                                : "bg-white/5 border-white/5 text-zinc-500 hover:border-white/20"
                            )}
                          >
                            <item.icon size={20} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 mt-2" disabled={isAdding}>
                        {isAdding ? <Loader2 className="animate-spin" /> : "Crear Categoría"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-20"><Loader2 className="animate-spin text-emerald-500 h-10 w-10" /></div>
          ) : (
            <div className="grid gap-4">
              {grupos.map((grupo, i) => (
                <div key={i} className="bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden hover:border-emerald-500/20 transition-all">
                  <div className="p-6 flex items-center gap-6 cursor-pointer" onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}>
                    <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <grupo.icon size={28} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{grupo.nombre}</h3>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{grupo.keywords?.join(", ")}</p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="text-2xl font-black text-emerald-500">${Math.abs(grupo.total).toLocaleString()}</p>
                    </div>
                    {grupo.id && (
                        <Button variant="ghost" size="icon" className="text-zinc-600 hover:text-rose-500" onClick={(e) => {e.stopPropagation(); deleteCategory(grupo.id)}}>
                            <Trash2 size={16} />
                        </Button>
                    )}
                    {expandedIndex === i ? <ChevronUp className="text-zinc-500" /> : <ChevronDown className="text-zinc-500" />}
                  </div>
                  
                  {expandedIndex === i && (
                    <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2">
                      <div className="bg-black/40 rounded-2xl p-4 border border-white/5 space-y-1">
                        <p className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-widest mb-3 px-2">Movimientos Detectados</p>
                        {Object.entries(grupo.desglose).length > 0 ? (
                            Object.entries(grupo.desglose).map(([tag, monto]: any) => (
                                <div key={tag} className="flex justify-between py-2.5 px-3 hover:bg-white/5 rounded-xl transition-colors">
                                  <span className="text-gray-300 text-sm capitalize">{tag}</span>
                                  <span className="font-bold text-white text-sm">${Math.abs(monto).toLocaleString()}</span>
                                </div>
                              ))
                        ) : (
                            <p className="text-xs text-zinc-600 text-center py-4 italic">No hay movimientos este mes.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

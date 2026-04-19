"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, Pencil, Trash2, Calendar, 
  AlertCircle, Loader2, ArrowUpCircle, ArrowDownCircle,
  Filter, Tag, CreditCard, Search
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

const MONTHS = [
  { value: 0, label: "Enero" }, { value: 1, label: "Febrero" },
  { value: 2, label: "Marzo" }, { value: 3, label: "Abril" },
  { value: 4, label: "Mayo" }, { value: 5, label: "Junio" },
  { value: 6, label: "Julio" }, { value: 7, label: "Agosto" },
  { value: 8, label: "Septiembre" }, { value: 9, label: "Octubre" },
  { value: 10, label: "Noviembre" }, { value: 11, label: "Diciembre" }
]

// --- COMPONENTE DE FORMULARIO MODAL ---
function ModalTransaccion({ 
  userId, 
  onRefresh, 
  editData = null 
}: { 
  userId: string, 
  onRefresh: () => void, 
  editData?: any 
}) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    const payload = {
      descripcion: formData.get("descripcion"),
      monto: parseFloat(formData.get("monto") as string),
      tipo: formData.get("tipo"),
      categoria: formData.get("categoria"),
      user_id: userId,
      created_at: editData ? editData.created_at : new Date().toISOString()
    }

    const { error } = editData 
      ? await supabase.from("transacciones").update(payload).eq('id', editData.id)
      : await supabase.from("transacciones").insert([payload])

    if (error) {
      toast.error("Error: " + error.message)
    } else {
      toast.success(editData ? "Transacción actualizada" : "¡Transacción registrada!")
      setOpen(false)
      onRefresh()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editData ? (
          <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <Pencil size={17}/>
          </Button>
        ) : (
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-900/20 w-full md:w-auto">
            <Plus size={18} /> Nuevo Movimiento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#121212] border-white/10 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <CreditCard className={editData ? "text-blue-500" : "text-emerald-500"} /> 
            {editData ? "Editar Transacción" : "Nuevo Registro"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input name="descripcion" defaultValue={editData?.descripcion} placeholder="Ej: Pago de Nómina" className="bg-white/5 border-white/10" required />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monto ($)</Label>
              <Input name="monto" type="number" step="any" defaultValue={editData?.monto} placeholder="50000" className="bg-white/5 border-white/10" required />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select name="tipo" defaultValue={editData?.tipo?.trim() || "Egreso"}>
                <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#121212] border-white/10 text-white">
                  <SelectItem value="Ingreso">Ingreso (+)</SelectItem>
                  <SelectItem value="Egreso">Egreso (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <Input name="categoria" defaultValue={editData?.categoria} placeholder="Ej: Alimentación" className="bg-white/5 border-white/10" required />
          </div>

          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 mt-2" disabled={loading}>
            {loading ? "Procesando..." : editData ? "Guardar Cambios" : "Registrar Transacción"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// --- PÁGINA PRINCIPAL ---
export default function TransaccionesPage() {
  const supabase = createClient()
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()
      const { data: mainProfile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single()
      
      if (profileData) {
        setProfile({ ...profileData, avatar_url: mainProfile?.avatar_url || profileData.avatar_url })
      }

      const baseDate = new Date(selectedYear, selectedMonth, 1)
      const rangeFrom = startOfMonth(baseDate)
      const rangeTo = endOfMonth(baseDate)

      const userIdToFilter = profileData?.cedula || user.id

      const { data, error } = await supabase
        .from("transacciones")
        .select("*")
        .eq("user_id", userIdToFilter)
        .gte("created_at", startOfDay(rangeFrom).toISOString())
        .lte("created_at", endOfDay(rangeTo).toISOString())
        .order("created_at", { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (err) {
      console.error(err)
      toast.error("Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTransactions() }, [selectedMonth, selectedYear])

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Eliminar este registro?")) return
    const { error } = await supabase.from("transacciones").delete().eq('id', id)
    if (error) toast.error("Error al borrar")
    else { toast.success("Eliminado correctamente"); fetchTransactions(); }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount)
  }

  const ingresos = transactions.filter(t => t.tipo?.trim() === "Ingreso").reduce((acc, t) => acc + (t.monto || 0), 0)
  const egresos = transactions.filter(t => t.tipo?.trim() === "Egreso").reduce((acc, t) => acc + (t.monto || 0), 0)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} />

      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar 
          userName={profile ? `${profile.nombres}` : "Usuario"} 
          avatarUrl={profile?.avatar_url}
          onMenuClick={() => setMobileSidebarOpen(true)} 
        />
        
        <main className="p-4 sm:p-8 space-y-6 max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic">Movimientos</h1>
              <p className="text-gray-400 text-sm flex items-center gap-2">
                <Filter size={14} className="text-emerald-500" />
                {MONTHS[selectedMonth].label} {selectedYear}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex bg-[#121212] border border-white/10 rounded-xl p-1 flex-1 md:flex-none justify-center">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer px-3 py-1.5"
                >
                  {MONTHS.map(m => <option key={m.value} value={m.value} className="bg-[#121212]">{m.label}</option>)}
                </select>
                <div className="w-px bg-white/10 my-1"></div>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer px-3 py-1.5"
                >
                  {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-[#121212]">{y}</option>)}
                </select>
              </div>
              <ModalTransaccion userId={profile?.cedula} onRefresh={fetchTransactions} />
            </div>
          </div>

          {/* Resumen Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-emerald-500/5 border-emerald-500/10 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-2 opacity-10"><ArrowUpCircle size={80} /></div>
              <CardContent className="p-5 flex items-center gap-4 relative">
                <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-500"><ArrowUpCircle size={24} /></div>
                <div>
                  <p className="text-[10px] text-emerald-500/70 uppercase font-black tracking-widest">Total Ingresos</p>
                  <p className="text-2xl md:text-3xl font-black">{formatCurrency(ingresos)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-rose-500/5 border-rose-500/10 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-2 opacity-10"><ArrowDownCircle size={80} /></div>
              <CardContent className="p-5 flex items-center gap-4 relative">
                <div className="p-3 bg-rose-500/20 rounded-2xl text-rose-500"><ArrowDownCircle size={24} /></div>
                <div>
                  <p className="text-[10px] text-rose-500/70 uppercase font-black tracking-widest">Total Gastos</p>
                  <p className="text-2xl md:text-3xl font-black">{formatCurrency(egresos)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Transacciones */}
          <div className="space-y-3">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Search size={14} /> Registro Histórico
            </h2>

            {loading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-emerald-500 h-8 w-8" />
                <p className="text-sm text-gray-500 font-medium">Cargando movimientos...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl text-gray-600 font-medium">
                No hay movimientos en este mes.
              </div>
            ) : (
              transactions.map(t => {
                const isIngreso = t.tipo?.trim() === "Ingreso"
                return (
                  <Card key={t.id} className="bg-[#121212] border-white/5 hover:border-white/10 transition-all duration-200 overflow-hidden">
                    <CardContent className="p-4 flex flex-col gap-4">
                      {/* FILA 1: ICONO E INFO PRINCIPAL */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={cn(
                            "p-3 rounded-2xl shrink-0",
                            isIngreso ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                          )}>
                            {isIngreso ? <ArrowUpCircle size={22} /> : <ArrowDownCircle size={22} />}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <h3 className="font-bold text-gray-100 text-sm md:text-base truncate">{t.descripcion || "Transacción"}</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">
                                {format(new Date(t.created_at), "dd MMM, yyyy", { locale: es })}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* MONTO EN ESCRITORIO (Se oculta en móvil para usar la fila inferior) */}
                        <div className="hidden md:block text-right">
                           <p className={cn("font-black text-xl tracking-tighter", isIngreso ? "text-emerald-400" : "text-rose-400")}>
                            {isIngreso ? "+" : "-"}{formatCurrency(t.monto)}
                          </p>
                        </div>
                      </div>

                      {/* FILA 2: CATEGORÍA, MONTO MÓVIL Y ACCIONES */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-3 md:pt-0 md:border-t-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] uppercase border-white/10 bg-white/5 text-gray-400 font-black px-2 py-0">
                            <Tag size={10} className="mr-1" /> {t.categoria || "General"}
                          </Badge>
                        </div>

                        {/* ACCIONES Y MONTO (Móvil) */}
                        <div className="flex items-center gap-3">
                          {/* Monto visible solo en móvil aquí */}
                          <p className={cn("md:hidden font-black text-base tracking-tighter", isIngreso ? "text-emerald-400" : "text-rose-400")}>
                            {isIngreso ? "+" : "-"}{formatCurrency(t.monto)}
                          </p>

                          <div className="flex items-center gap-1 border-l border-white/10 pl-2">
                            <ModalTransaccion userId={profile?.cedula} onRefresh={fetchTransactions} editData={t} />
                            <Button 
                              onClick={() => handleEliminar(t.id)} 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-rose-500/70 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 size={17}/>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

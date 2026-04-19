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
  Plus, Pencil, Trash2, Loader2, ArrowUpCircle, ArrowDownCircle
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { format, startOfMonth, endOfMonth } from "date-fns"
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
function ModalTransaccion({ userId, onRefresh, editData = null }: { userId: string, onRefresh: () => void, editData?: any }) {
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

    if (error) toast.error("Error: " + error.message)
    else {
      toast.success(editData ? "Actualizado" : "Registrado")
      setOpen(false)
      onRefresh()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editData ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
            <Pencil size={16}/>
          </Button>
        ) : (
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 w-full md:w-auto shadow-lg">
            <Plus size={18} /> Nuevo Movimiento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#121212] border-white/10 text-white sm:max-w-[425px]">
        <DialogHeader><DialogTitle>{editData ? "Editar" : "Nuevo"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="descripcion" defaultValue={editData?.descripcion} placeholder="Descripción" className="bg-white/5 border-white/10" required />
          <div className="grid grid-cols-2 gap-4">
            <Input name="monto" type="number" step="any" defaultValue={editData?.monto} placeholder="Monto" className="bg-white/5 border-white/10" required />
            <Select name="tipo" defaultValue={editData?.tipo?.trim() || "Egreso"}>
              <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#121212] border-white/10 text-white">
                <SelectItem value="Ingreso">Ingreso</SelectItem>
                <SelectItem value="Egreso">Egreso</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input name="categoria" defaultValue={editData?.categoria} placeholder="Categoría" className="bg-white/5 border-white/10" required />
          <Button type="submit" className="w-full bg-emerald-600" disabled={loading}>{loading ? "Cargando..." : "Guardar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
      setProfile(prof)
      const baseDate = new Date(selectedYear, selectedMonth, 1)
      const { data } = await supabase.from("transacciones").select("*")
        .eq("user_id", prof?.cedula)
        .gte("created_at", startOfMonth(baseDate).toISOString())
        .lte("end_at", endOfMonth(baseDate).toISOString())
        .order("created_at", { ascending: false })
      setTransactions(data || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { fetchTransactions() }, [selectedMonth, selectedYear])

  const handleEliminar = async (id: number) => {
    if (confirm("¿Eliminar este registro?")) {
      await supabase.from("transacciones").delete().eq('id', id)
      fetchTransactions()
      toast.success("Eliminado")
    }
  }

  const formatCurrency = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n)

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0a0a0a] text-white">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} />

      <div className={cn("transition-all duration-300 flex-1 flex flex-col", "ml-0", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar userName={profile?.full_name || "Usuario"} avatarUrl={profile?.avatar_url} onMenuClick={() => setMobileSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full">
          {/* HEADER RESPONSIVE */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">Mis Movimientos</h1>
              <p className="text-gray-500 text-xs font-bold uppercase">Visualizando {MONTHS[selectedMonth].label} {selectedYear}</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex bg-[#121212] border border-white/10 rounded-xl p-1 justify-between">
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-transparent border-none text-xs font-bold p-2 outline-none">
                  {MONTHS.map(m => <option key={m.value} value={m.value} className="bg-[#121212]">{m.label}</option>)}
                </select>
                <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-transparent border-none text-xs font-bold p-2 outline-none">
                  {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-[#121212]">{y}</option>)}
                </select>
              </div>
              <ModalTransaccion userId={profile?.cedula} onRefresh={fetchTransactions} />
            </div>
          </div>

          {/* LISTA DE TARJETAS */}
          <div className="grid gap-3">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" /></div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-20 text-gray-600 border border-dashed border-white/5 rounded-3xl">No hay registros este mes.</div>
            ) : (
              transactions.map(t => {
                const isIngreso = t.tipo?.trim() === "Ingreso"
                return (
                  <Card key={t.id} className="bg-[#121212] border-white/5 hover:border-white/10 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex flex-col gap-3">
                        
                        {/* PARTE SUPERIOR: ICONO + INFO */}
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-xl shrink-0", isIngreso ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                            {isIngreso ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-sm text-gray-100 truncate">{t.descripcion}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[9px] border-white/10 bg-white/5 text-gray-400 font-bold px-1.5 py-0 uppercase">{t.categoria}</Badge>
                              <span className="text-[10px] text-gray-600 font-bold uppercase">{format(new Date(t.created_at), "dd MMM", { locale: es })}</span>
                            </div>
                          </div>
                        </div>

                        {/* PARTE INFERIOR: MONTO Y ACCIONES (ALINEADOS HORIZONTALMENTE) */}
                        <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
                          <p className={cn("font-black text-lg tracking-tight", isIngreso ? "text-emerald-400" : "text-rose-400")}>
                            {isIngreso ? "+" : "-"}{formatCurrency(t.monto)}
                          </p>
                          
                          <div className="flex items-center gap-1 bg-white/5 rounded-lg px-1">
                            <ModalTransaccion userId={profile?.cedula} onRefresh={fetchTransactions} editData={t} />
                            <div className="w-[1px] h-4 bg-white/10 mx-0.5" />
                            <Button 
                              onClick={() => handleEliminar(t.id)} 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                            >
                              <Trash2 size={16}/>
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

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
import { Plus, Pencil, Trash2, Bell, Calendar, Clock, AlertCircle, CheckCircle2, Loader2, BellRing } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { format, differenceInDays, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

// --- COMPONENTE DEL MODAL (Interno para evitar errores de ruta) ---
function ModalNuevoRecordatorio({ userCedula, onRefresh }: { userCedula: string, onRefresh: () => void }) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    const data = {
      titulo: formData.get("titulo"),
      monto: parseFloat(formData.get("monto") as string),
      fecha_vencimiento: formData.get("fecha"),
      recordar_dias_antes: parseInt(formData.get("dias") as string),
      frecuencia: formData.get("frecuencia"),
      categoria: formData.get("categoria"),
      user_id: userCedula,
      estado: 'pendiente'
    }

    const { error } = await supabase.from("recordatorios").insert([data])

    if (error) {
      toast.error("Error al guardar: " + error.message)
    } else {
      toast.success("¡Recordatorio activado! El bot te avisará.")
      setOpen(false)
      onRefresh()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus size={18} /> Nuevo Recordatorio
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#121212] border-white/10 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <BellRing className="text-emerald-500" /> Programar Alerta
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>¿Qué pago quieres recordar?</Label>
            <Input name="titulo" placeholder="Ej: Internet Claro" className="bg-white/5 border-white/10" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monto ($)</Label>
              <Input name="monto" type="number" placeholder="89000" className="bg-white/5 border-white/10" required />
            </div>
            <div className="space-y-2">
              <Label>Fecha de Pago</Label>
              <Input name="fecha" type="date" className="bg-white/5 border-white/10" required />
            </div>
          </div>
          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl space-y-2">
            <Label className="text-orange-400 font-bold">Configuración del Bot</Label>
            <div className="flex items-center gap-2 text-sm">
              <span>Avisarme</span>
              <Input name="dias" type="number" defaultValue="10" className="w-16 bg-black/40 border-orange-500/30 text-center text-orange-500 font-bold" min="0" />
              <span>días antes.</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frecuencia</Label>
              <Select name="frecuencia" defaultValue="Mensual">
                <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#121212] border-white/10 text-white">
                  <SelectItem value="Mensual">Mensual</SelectItem>
                  <SelectItem value="Único">Una vez</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Input name="categoria" placeholder="Servicios" className="bg-white/5 border-white/10" />
            </div>
          </div>
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
            {loading ? "Guardando..." : "Confirmar Recordatorio"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// --- PÁGINA PRINCIPAL (EXPORT DEFAULT OBLIGATORIO) ---
export default function RecordatoriosPage() {
  const supabase = createClient()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      setProfile(profileData)

      if (profileData?.cedula) {
        const { data } = await supabase
          .from("recordatorios")
          .select("*")
          .eq("user_id", profileData.cedula)
          .order("fecha_vencimiento", { ascending: true })
        if (data) setReminders(data)
      }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount)
  }

  const getStatusInfo = (dueDate: string, status: string) => {
    const days = differenceInDays(parseISO(dueDate), new Date())
    if (status === "completado") return { label: "Pagado", class: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle2 }
    if (days < 0) return { label: "Vencido", class: "bg-rose-500/20 text-rose-400", icon: AlertCircle }
    return { label: `En ${days} días`, class: days <= 3 ? "bg-rose-500 text-white animate-pulse" : "bg-blue-500/20 text-blue-400", icon: Bell }
  }

  const pending = reminders.filter(r => r.estado !== "completado")
  const total = pending.reduce((acc, r) => acc + (r.monto || 0), 0)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} />
      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar userName={profile?.full_name || "Usuario"} onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="p-4 sm:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Recordatorios</h1>
              <p className="text-gray-400">El bot te notificará según tus preferencias.</p>
            </div>
            <ModalNuevoRecordatorio userCedula={profile?.cedula} onRefresh={fetchData} />
          </div>

          <Card className="border-white/10 bg-gradient-to-br from-orange-500/10 to-transparent">
            <CardContent className="p-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <AlertCircle className="text-orange-500 h-10 w-10" />
                <div>
                  <p className="text-xs text-orange-500 uppercase font-bold">Pendiente por pagar</p>
                  <p className="text-3xl font-black">{formatCurrency(total)}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-orange-500 border-orange-500/30">{pending.length} facturas</Badge>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {loading ? <Loader2 className="animate-spin mx-auto text-emerald-500" /> : 
              pending.map(r => {
                const status = getStatusInfo(r.fecha_vencimiento, r.estado)
                const Icon = status.icon
                return (
                  <Card key={r.id} className="bg-[#121212] border-white/5 hover:border-emerald-500/30 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-lg", status.class)}><Icon size={20} /></div>
                        <div>
                          <h3 className="font-bold">{r.titulo}</h3>
                          <p className="text-xs text-gray-500">Vence: {format(parseISO(r.fecha_vencimiento), "dd 'de' MMMM", { locale: es })}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(r.monto)}</p>
                        <Badge variant="secondary" className="text-[10px]">Aviso: {r.recordar_dias_antes} días antes</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            }
          </div>
        </main>
      </div>
    </div>
  )
}

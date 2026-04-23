

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
  Plus, Pencil, Trash2, Bell, Calendar, Clock, 
  AlertCircle, CheckCircle2, Loader2, BellRing, Send,
  MessageCircle 
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { format, differenceInDays, parseISO, addMonths } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

// --- COMPONENTE DE FORMULARIO MODAL ---
function ModalRecordatorio({ 
  userCedula, 
  userPhone, 
  userTelegram, 
  onRefresh, 
  editData = null 
}: { 
  userCedula: string, 
  userPhone: string,
  userTelegram: string,
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
      titulo: formData.get("titulo"),
      monto: parseFloat(formData.get("monto") as string),
      fecha_vencimiento: formData.get("fecha"),
      recordar_dias_antes: parseInt(formData.get("dias") as string),
      frecuencia: formData.get("frecuencia"),
      categoria: formData.get("categoria"),
      user_id: userCedula,
      telefono_destino: userPhone,
      telegram_id: userTelegram,
      estado: editData?.estado || 'pendiente'
    }

    const { error } = editData 
      ? await supabase.from("recordatorios").update(payload).eq('id', editData.id)
      : await supabase.from("recordatorios").insert([payload])

    if (error) {
      toast.error("Error: " + error.message)
    } else {
      toast.success(editData ? "Actualizado correctamente" : "¡Recordatorio activado!")
      setOpen(false)
      onRefresh()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editData ? (
          <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-white">
            <Pencil size={18}/>
          </Button>
        ) : (
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Plus size={18} /> Nuevo Recordatorio
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#121212] border-white/10 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <BellRing className={editData ? "text-orange-500" : "text-emerald-500"} /> 
            {editData ? "Editar Recordatorio" : "Programar Alerta"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>¿Qué pago quieres recordar?</Label>
            <Input name="titulo" defaultValue={editData?.titulo} placeholder="Ej: Internet Claro" className="bg-white/5 border-white/10 text-white" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monto ($)</Label>
              <Input name="monto" type="number" defaultValue={editData?.monto} placeholder="89000" className="bg-white/5 border-white/10 text-white" required />
            </div>
            <div className="space-y-2">
              <Label>Fecha de Pago</Label>
              <Input name="fecha" type="date" defaultValue={editData?.fecha_vencimiento} className="bg-white/5 border-white/10 text-white" required />
            </div>
          </div>
          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl space-y-2">
            <Label className="text-orange-400 font-bold">Configuración del Bot</Label>
            <div className="flex items-center gap-2 text-sm">
              <span>Avisarme</span>
              <Input name="dias" type="number" defaultValue={editData?.recordar_dias_antes || 1} className="w-16 bg-black/40 border-orange-500/30 text-center text-orange-500 font-bold" min="0" />
              <span>días antes.</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Recurrencia</Label>
              <Select name="frecuencia" defaultValue={editData?.frecuencia || "Mensual"}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#121212] border-white/10 text-white">
                  <SelectItem value="Mensual">🔄 Todos los meses</SelectItem>
                  <SelectItem value="Único">📍 Una sola vez</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Input name="categoria" defaultValue={editData?.categoria} placeholder="Servicios" className="bg-white/5 border-white/10 text-white" />
            </div>
          </div>
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
            {loading ? "Procesando..." : editData ? "Guardar Cambios" : "Confirmar Recordatorio"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// --- PÁGINA PRINCIPAL ---
export default function RecordatoriosPage() {
  const supabase = createClient()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [isTestingBot, setIsTestingBot] = useState(false)
  const [isTestingWhatsApp, setIsTestingWhatsApp] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()
      const { data: mainProfile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single()
      
      if (profileData) {
        setProfile({ ...profileData, avatar_url: mainProfile?.avatar_url || profileData.avatar_url })
        const { data } = await supabase.from("recordatorios").select("*").eq("user_id", profileData.cedula).order("fecha_vencimiento", { ascending: true })
        if (data) setReminders(data)
      }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  // Botones de prueba simplificados (La Edge Function ya sabe a quién enviar)
  const handleTestBot = async () => {
    setIsTestingBot(true);
    try {
      await fetch(`https://rdyaeslcznsynfgowutw.supabase.co/functions/v1/rapid-handler?type=telegram&t=${Date.now()}`, { method: 'GET', mode: 'cors' });
      toast.success("✅ Prueba de Telegram enviada");
    } catch (error) { toast.error("Error en Telegram"); } finally { setIsTestingBot(false); }
  };

  const handleTestWhatsApp = async () => {
    setIsTestingWhatsApp(true);
    try {
      await fetch(`https://rdyaeslcznsynfgowutw.supabase.co/functions/v1/rapid-handler?type=whatsapp&t=${Date.now()}`, { method: 'GET', mode: 'cors' });
      toast.success("✅ WhatsApp enviado");
    } catch (error) { toast.error("Error en WhatsApp"); } finally { setIsTestingWhatsApp(false); }
  };

  const handleMarcarComoPagado = async (reminder: any) => {
    try {
      // 1. Marcar actual como completado
      const { error: updateError } = await supabase.from("recordatorios").update({ estado: 'completado' }).eq('id', reminder.id)
      if (updateError) throw updateError

      // 2. Si es mensual, crear el del próximo mes automáticamente
      if (reminder.frecuencia === "Mensual") {
        const fechaActual = parseISO(reminder.fecha_vencimiento)
        const proximaFecha = addMonths(fechaActual, 1)

        const nuevoRecordatorio = {
          titulo: reminder.titulo,
          monto: reminder.monto,
          fecha_vencimiento: format(proximaFecha, "yyyy-MM-dd"),
          recordar_dias_antes: reminder.recordar_dias_antes,
          frecuencia: "Mensual",
          categoria: reminder.categoria,
          user_id: reminder.user_id,
          telefono_destino: reminder.telefono_destino,
          telegram_id: reminder.telegram_id,
          estado: 'pendiente'
        }

        await supabase.from("recordatorios").insert([nuevoRecordatorio])
        toast.success("¡Pago registrado! Próximo mes programado.")
      } else {
        toast.success("¡Pago registrado!");
      }
      fetchData();
    } catch (error: any) { toast.error("Error: " + error.message) }
  }

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Eliminar este recordatorio?")) return
    const { error } = await supabase.from("recordatorios").delete().eq('id', id)
    if (error) toast.error("Error al borrar")
    else { toast.success("Eliminado"); fetchData(); }
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount)

  const getStatusInfo = (dueDate: string, status: string) => {
    const days = differenceInDays(parseISO(dueDate), new Date())
    if (status === "completado") return { label: "Pagado", class: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle2 }
    if (days < 0) return { label: "Vencido", class: "bg-rose-500/20 text-rose-400", icon: AlertCircle }
    return { label: days === 0 ? "Vence hoy" : `En ${days} días`, class: days <= 3 ? "bg-rose-500 text-white animate-pulse" : "bg-blue-500/20 text-blue-400", icon: Bell }
  }

  const pending = reminders.filter(r => r.estado !== "completado")
  const total = pending.reduce((acc, r) => acc + (r.monto || 0), 0)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} />
      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar userName={profile ? `${profile.nombres}` : "Usuario"} avatarUrl={profile?.avatar_url} onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Recordatorios</h1>
              <p className="text-gray-400 text-sm">Alertas automáticas vía WhatsApp y Telegram.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleTestWhatsApp} disabled={isTestingWhatsApp} className="border-green-500/30 text-green-500 hover:bg-green-500/10 gap-2">
                {isTestingWhatsApp ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle size={18} />}
                Prueba WA
              </Button>
              <Button variant="outline" onClick={handleTestBot} disabled={isTestingBot} className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 gap-2">
                {isTestingBot ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={16} />}
                Prueba TG
              </Button>
              <ModalRecordatorio userCedula={profile?.cedula} userPhone={profile?.telefono} userTelegram={profile?.telegram_id} onRefresh={fetchData} />
            </div>
          </div>

          <Card className="border-white/10 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent">
            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/20 rounded-2xl"><AlertCircle className="text-orange-500 h-8 w-8" /></div>
                <div>
                  <p className="text-xs text-orange-500/80 uppercase font-black">Total Pendiente</p>
                  <p className="text-4xl font-black">{formatCurrency(total)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2"><Clock size={14} /> Calendario de Pagos</h2>
            {loading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div> : 
              pending.length === 0 ? <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl text-gray-600">No hay pagos pendientes.</div> : (
                pending.map(r => {
                    const status = getStatusInfo(r.fecha_vencimiento, r.estado)
                    const Icon = status.icon
                    return (
                    <Card key={r.id} className="bg-[#121212] border-white/5 hover:border-emerald-500/30 transition-all overflow-hidden">
                        <CardContent className="p-0 flex items-stretch">
                            <div className={cn("w-1.5", status.class.split(' ')[0])} />
                            <div className="p-4 flex flex-col sm:flex-row items-center justify-between w-full gap-4">
                                <div className="flex items-center gap-4 w-full">
                                    <div className={cn("p-3 rounded-xl", status.class)}><Icon size={20} /></div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-100">{r.titulo}</h3>
                                            <Badge variant="outline" className={cn("text-[10px] font-bold border-none", status.class)}>{r.frecuencia === 'Mensual' ? '🔄 ' : ''}{status.label}</Badge>
                                        </div>
                                        <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={12}/> {format(parseISO(r.fecha_vencimiento), "dd 'de' MMMM", { locale: es })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                    <div className="text-right">
                                        <p className="font-black text-xl text-white">{formatCurrency(r.monto)}</p>
                                        <p className="text-[10px] text-orange-500">Aviso {r.recordar_dias_antes} días antes</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button onClick={() => handleMarcarComoPagado(r)} variant="ghost" size="icon" className="h-9 w-9 text-emerald-500 hover:bg-emerald-500/10"><CheckCircle2 size={18}/></Button>
                                        <ModalRecordatorio userCedula={profile?.cedula} userPhone={profile?.telefono} userTelegram={profile?.telegram_id} onRefresh={fetchData} editData={r} />
                                        <Button onClick={() => handleEliminar(r.id)} variant="ghost" size="icon" className="h-9 w-9 text-rose-500 hover:bg-rose-500/10"><Trash2 size={18}/></Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    )
                })
              )
            }
          </div>
        </main>
      </div>
    </div>
  )
}

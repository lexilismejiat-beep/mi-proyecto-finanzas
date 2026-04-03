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
  Plus, Pencil, Trash2, Bell, Calendar, Clock, 
  AlertCircle, CheckCircle2, Loader2, BellRing, Send 
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { format, differenceInDays, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

// --- COMPONENTE DE FORMULARIO ---
function ModalRecordatorio({ 
  userCedula, 
  onRefresh, 
  editData = null 
}: { 
  userCedula: string, 
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
            <Input name="titulo" defaultValue={editData?.titulo} placeholder="Ej: Internet Claro" className="bg-white/5 border-white/10" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monto ($)</Label>
              <Input name="monto" type="number" defaultValue={editData?.monto} placeholder="89000" className="bg-white/5 border-white/10" required />
            </div>
            <div className="space-y-2">
              <Label>Fecha de Pago</Label>
              <Input name="fecha" type="date" defaultValue={editData?.fecha_vencimiento} className="bg-white/5 border-white/10" required />
            </div>
          </div>
          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl space-y-2">
            <Label className="text-orange-400 font-bold">Configuración del Bot</Label>
            <div className="flex items-center gap-2 text-sm">
              <span>Avisarme</span>
              <Input name="dias" type="number" defaultValue={editData?.recordar_dias_antes || 10} className="w-16 bg-black/40 border-orange-500/30 text-center text-orange-500 font-bold" min="0" />
              <span>días antes.</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frecuencia</Label>
              <Select name="frecuencia" defaultValue={editData?.frecuencia || "Mensual"}>
                <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#121212] border-white/10 text-white">
                  <SelectItem value="Mensual">Mensual</SelectItem>
                  <SelectItem value="Único">Una vez</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Input name="categoria" defaultValue={editData?.categoria} placeholder="Servicios" className="bg-white/5 border-white/10" />
            </div>
          </div>
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
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

  // --- FUNCIÓN PARA PROBAR EL BOT CON BOTPRESS ---
  const handleTestBot = async () => {
    if (!profile?.cedula) return toast.error("No se encontró tu identificación para enviar el test.")
    
    setIsTestingBot(true)
    try {
      // REEMPLAZA ESTA URL POR TU WEBHOOK DE BOTPRESS
      const BOTPRESS_WEBHOOK_URL = "https://webhook.botpress.cloud/e8c0a034-6706-4372-ac3f-1c7ebf003793"
      
      const response = await fetch(BOTPRESS_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: profile.cedula,
          type: "test_notification",
          message: "Hola, ya todo está listo, puedes empezar a agendar tus recordatorios."
        })
      })

      if (response.ok) {
        toast.success("¡Mensaje de prueba enviado!")
      } else {
        toast.error("El bot recibió la señal pero hubo un problema.")
      }
    } catch (error) {
      console.error(error)
      toast.error("Error de conexión con el bot.")
    } finally {
      setIsTestingBot(false)
    }
  }

  const handleMarcarComoPagado = async (id: number) => {
    const { error } = await supabase.from("recordatorios").update({ estado: 'completado' }).eq('id', id)
    if (error) toast.error("Error al actualizar")
    else { toast.success("¡Pago registrado!"); fetchData(); }
  }

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Eliminar este recordatorio? El bot dejará de avisarte.")) return
    const { error } = await supabase.from("recordatorios").delete().eq('id', id)
    if (error) toast.error("Error al borrar")
    else { toast.success("Recordatorio eliminado"); fetchData(); }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount)
  }

  const getStatusInfo = (dueDate: string, status: string) => {
    const days = differenceInDays(parseISO(dueDate), new Date())
    if (status === "completado") return { label: "Pagado", class: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle2 }
    if (days < 0) return { label: "Vencido", class: "bg-rose-500/20 text-rose-400", icon: AlertCircle }
    return { 
        label: days === 0 ? "Vence hoy" : `En ${days} días`, 
        class: days <= 3 ? "bg-rose-500 text-white animate-pulse" : "bg-blue-500/20 text-blue-400", 
        icon: Bell 
    }
  }

  const pending = reminders.filter(r => r.estado !== "completado")
  const completed = reminders.filter(r => r.estado === "completado")
  const total = pending.reduce((acc, r) => acc + (r.monto || 0), 0)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} />
      
      <div className={cn("transition-all duration-300", "lg:ml-64", sidebarCollapsed && "lg:ml-16")}>
        <TopBar userName={profile?.full_name || "Usuario"} onMenuClick={() => setMobileSidebarOpen(true)} />
        
        <main className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Recordatorios</h1>
              <p className="text-gray-400 text-sm">Gestiona tus alertas automáticas del bot.</p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* BOTÓN DE TEST BOT */}
              <Button 
                variant="outline" 
                onClick={handleTestBot}
                disabled={isTestingBot || loading}
                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-colors gap-2"
              >
                {isTestingBot ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={16} />}
                {isTestingBot ? "Enviando..." : "Probar Bot"}
              </Button>

              <ModalRecordatorio userCedula={profile?.cedula} onRefresh={fetchData} />
            </div>
          </div>

          {/* Banner de Resumen */}
          <Card className="border-white/10 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent">
            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/20 rounded-2xl">
                    <AlertCircle className="text-orange-500 h-8 w-8" />
                </div>
                <div>
                  <p className="text-xs text-orange-500/80 uppercase font-black tracking-tighter">Total Pendiente Mensual</p>
                  <p className="text-4xl font-black">{formatCurrency(total)}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-center bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                    <p className="text-xl font-bold">{pending.length}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Por pagar</p>
                </div>
                <div className="text-center bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                    <p className="text-xl font-bold text-emerald-500">{completed.length}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Pagados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Listado de Recordatorios */}
          <div className="grid gap-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Clock size={14} /> Cronograma de pagos
            </h2>
            {loading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div> : 
              pending.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl text-gray-600">
                    No tienes pagos pendientes. ¡Buen trabajo!
                </div>
              ) : (
                pending.map(r => {
                    const status = getStatusInfo(r.fecha_vencimiento, r.estado)
                    const Icon = status.icon
                    return (
                    <Card key={r.id} className="group bg-[#121212] border-white/5 hover:border-emerald-500/30 transition-all overflow-hidden">
                        <CardContent className="p-0 flex items-stretch">
                            <div className={cn("w-1.5", status.class.split(' ')[0])} />
                            <div className="p-4 flex flex-col sm:flex-row items-center justify-between w-full gap-4">
                                <div className="flex items-center gap-4 w-full">
                                    <div className={cn("p-3 rounded-xl shrink-0", status.class)}><Icon size={20} /></div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-100">{r.titulo}</h3>
                                            <Badge variant="outline" className={cn("text-[10px] border-none font-bold", status.class)}>{status.label}</Badge>
                                        </div>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Calendar size={12}/> Vence el {format(parseISO(r.fecha_vencimiento), "dd 'de' MMMM", { locale: es })}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                    <div className="text-right">
                                        <p className="font-black text-xl text-white">{formatCurrency(r.monto)}</p>
                                        <p className="text-[10px] text-orange-500 font-medium">Bot avisa {r.recordar_dias_antes} días antes</p>
                                    </div>

                                    <div className="flex gap-1">
                                        <Button onClick={() => handleMarcarComoPagado(r.id)} variant="ghost" size="icon" className="h-9 w-9 text-emerald-500 hover:bg-emerald-500/10">
                                            <CheckCircle2 size={18}/>
                                        </Button>
                                        
                                        <ModalRecordatorio userCedula={profile?.cedula} onRefresh={fetchData} editData={r} />

                                        <Button onClick={() => handleEliminar(r.id)} variant="ghost" size="icon" className="h-9 w-9 text-rose-500 hover:bg-rose-500/10">
                                            <Trash2 size={18}/>
                                        </Button>
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

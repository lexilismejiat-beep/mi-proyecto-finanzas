"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Bell, BellOff, Calendar, Clock, AlertCircle, CheckCircle2 } from "lucide-react"

const reminders = [
  {
    id: "1",
    title: "Pago de arriendo",
    description: "Transferencia mensual a propietario",
    amount: 1500000,
    dueDate: "01 abr 2024",
    frequency: "Mensual",
    category: "Vivienda",
    status: "pending",
    daysUntil: 3,
  },
  {
    id: "2",
    title: "Factura de internet",
    description: "Claro - Plan hogar 100 Mbps",
    amount: 89000,
    dueDate: "05 abr 2024",
    frequency: "Mensual",
    category: "Servicios",
    status: "pending",
    daysUntil: 7,
  },
  {
    id: "3",
    title: "Pago tarjeta de crédito",
    description: "Banco de Bogotá - Mínimo",
    amount: 450000,
    dueDate: "15 abr 2024",
    frequency: "Mensual",
    category: "Deudas",
    status: "pending",
    daysUntil: 17,
  },
  {
    id: "4",
    title: "Suscripción Netflix",
    description: "Plan Premium",
    amount: 45000,
    dueDate: "20 abr 2024",
    frequency: "Mensual",
    category: "Entretenimiento",
    status: "active",
    daysUntil: 22,
  },
  {
    id: "5",
    title: "Seguro del carro",
    description: "Sura - Póliza todo riesgo",
    amount: 280000,
    dueDate: "01 may 2024",
    frequency: "Trimestral",
    category: "Seguros",
    status: "active",
    daysUntil: 33,
  },
  {
    id: "6",
    title: "Pago de servicios",
    description: "Agua, luz y gas - Pagado",
    amount: 185000,
    dueDate: "25 mar 2024",
    frequency: "Mensual",
    category: "Servicios",
    status: "completed",
    daysUntil: -4,
  },
]

export default function RecordatoriosPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string, daysUntil: number) => {
    if (status === "completed") {
      return <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">Completado</Badge>
    }
    if (daysUntil <= 3) {
      return <Badge variant="destructive">Urgente</Badge>
    }
    if (daysUntil <= 7) {
      return <Badge className="bg-orange-500/20 text-orange-400">Próximo</Badge>
    }
    return <Badge variant="secondary">Programado</Badge>
  }

  const pendingReminders = reminders.filter(r => r.status !== "completed")
  const completedReminders = reminders.filter(r => r.status === "completed")
  const totalPending = pendingReminders.reduce((acc, r) => acc + r.amount, 0)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
      />

      <div
        className={cn(
          "transition-all duration-300",
          "lg:ml-64",
          sidebarCollapsed && "lg:ml-16"
        )}
      >
        <TopBar 
          userName="Juan Pérez" 
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Recordatorios</h1>
              <p className="text-muted-foreground">Gestiona tus pagos programados y fechas importantes</p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Recordatorio
            </Button>
          </div>

          {/* Summary Card */}
          <Card className="mb-6 bg-gradient-to-br from-orange-500/10 to-orange-500/5">
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20">
                  <AlertCircle className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pagos pendientes este mes</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(totalPending)}</p>
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{pendingReminders.length}</p>
                  <p className="text-muted-foreground">Pendientes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-400">{completedReminders.length}</p>
                  <p className="text-muted-foreground">Completados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reminders List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Próximos pagos</h2>
            
            {pendingReminders.map((reminder) => (
              <Card key={reminder.id} className="group">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      reminder.daysUntil <= 3 ? "bg-destructive/20" : "bg-primary/20"
                    )}>
                      <Bell className={cn(
                        "h-5 w-5",
                        reminder.daysUntil <= 3 ? "text-destructive" : "text-primary"
                      )} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-card-foreground">{reminder.title}</h3>
                        {getStatusBadge(reminder.status, reminder.daysUntil)}
                      </div>
                      <p className="text-sm text-muted-foreground">{reminder.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {reminder.dueDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {reminder.frequency}
                        </span>
                        <Badge variant="outline" className="text-xs">{reminder.category}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(reminder.amount)}</p>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Marcar como pagado">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Completed Section */}
            <h2 className="mt-8 text-lg font-semibold text-foreground">Completados</h2>
            {completedReminders.map((reminder) => (
              <Card key={reminder.id} className="group opacity-60">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-card-foreground line-through">{reminder.title}</h3>
                        {getStatusBadge(reminder.status, reminder.daysUntil)}
                      </div>
                      <p className="text-sm text-muted-foreground">{reminder.description}</p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-muted-foreground">{formatCurrency(reminder.amount)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

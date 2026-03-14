"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, CreditCard, Landmark, Wallet, PiggyBank } from "lucide-react"

const accounts = [
  {
    id: "1",
    name: "Cuenta Corriente",
    bank: "Bancolombia",
    type: "checking",
    balance: 4850000,
    icon: Landmark,
    color: "bg-blue-500/20 text-blue-400",
    lastFour: "4523",
  },
  {
    id: "2",
    name: "Cuenta de Ahorros",
    bank: "Davivienda",
    type: "savings",
    balance: 12350000,
    icon: PiggyBank,
    color: "bg-emerald-500/20 text-emerald-400",
    lastFour: "8891",
  },
  {
    id: "3",
    name: "Tarjeta de Crédito",
    bank: "Banco de Bogotá",
    type: "credit",
    balance: -1250000,
    icon: CreditCard,
    color: "bg-orange-500/20 text-orange-400",
    lastFour: "7234",
  },
  {
    id: "4",
    name: "Efectivo",
    bank: "Personal",
    type: "cash",
    balance: 450000,
    icon: Wallet,
    color: "bg-purple-500/20 text-purple-400",
    lastFour: "",
  },
]

export default function CuentasPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const totalBalance = accounts.reduce((acc, account) => acc + account.balance, 0)

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
              <h1 className="text-2xl font-bold text-foreground">Cuentas</h1>
              <p className="text-muted-foreground">Administra tus cuentas bancarias y métodos de pago</p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Cuenta
            </Button>
          </div>

          {/* Total Balance Card */}
          <Card className="mb-6 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Balance Total</p>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(totalBalance)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{accounts.length} cuentas vinculadas</p>
            </CardContent>
          </Card>

          {/* Accounts Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => {
              const Icon = account.icon
              const isNegative = account.balance < 0
              
              return (
                <Card key={account.id} className="group relative overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", account.color)}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h3 className="font-semibold text-card-foreground">{account.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {account.bank} {account.lastFour && `•••• ${account.lastFour}`}
                      </p>
                    </div>
                    
                    <div className="mt-4">
                      <p className={cn(
                        "text-2xl font-bold",
                        isNegative ? "text-destructive" : "text-foreground"
                      )}>
                        {formatCurrency(account.balance)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {account.type === "credit" ? "Deuda actual" : "Saldo disponible"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { 
  ShoppingCart, 
  Home, 
  Car, 
  Utensils, 
  Gamepad2, 
  Briefcase, 
  TrendingUp,
  Wallet,
  Heart,
  GraduationCap
} from "lucide-react"

const categories = [
  { id: "1", name: "Salario", icon: Briefcase, color: "bg-emerald-500/20 text-emerald-400", type: "income", budget: 0 },
  { id: "2", name: "Freelance", icon: Wallet, color: "bg-blue-500/20 text-blue-400", type: "income", budget: 0 },
  { id: "3", name: "Inversiones", icon: TrendingUp, color: "bg-purple-500/20 text-purple-400", type: "income", budget: 0 },
  { id: "4", name: "Alimentación", icon: ShoppingCart, color: "bg-orange-500/20 text-orange-400", type: "expense", budget: 500000 },
  { id: "5", name: "Vivienda", icon: Home, color: "bg-cyan-500/20 text-cyan-400", type: "expense", budget: 1500000 },
  { id: "6", name: "Transporte", icon: Car, color: "bg-yellow-500/20 text-yellow-400", type: "expense", budget: 200000 },
  { id: "7", name: "Restaurantes", icon: Utensils, color: "bg-red-500/20 text-red-400", type: "expense", budget: 300000 },
  { id: "8", name: "Entretenimiento", icon: Gamepad2, color: "bg-pink-500/20 text-pink-400", type: "expense", budget: 200000 },
  { id: "9", name: "Salud", icon: Heart, color: "bg-rose-500/20 text-rose-400", type: "expense", budget: 150000 },
  { id: "10", name: "Educación", icon: GraduationCap, color: "bg-indigo-500/20 text-indigo-400", type: "expense", budget: 100000 },
]

export default function CategoriasPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const incomeCategories = categories.filter(c => c.type === "income")
  const expenseCategories = categories.filter(c => c.type === "expense")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

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
              <h1 className="text-2xl font-bold text-foreground">Categorías</h1>
              <p className="text-muted-foreground">Organiza tus ingresos y gastos por categorías</p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Categoría
            </Button>
          </div>

          {/* Income Categories */}
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Categorías de Ingresos</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {incomeCategories.map((category) => {
                const Icon = category.icon
                return (
                  <Card key={category.id} className="group relative">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", category.color)}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-card-foreground">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">Ingreso</p>
                      </div>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Expense Categories */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Categorías de Gastos</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {expenseCategories.map((category) => {
                const Icon = category.icon
                return (
                  <Card key={category.id} className="group relative">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", category.color)}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-card-foreground">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Presupuesto: {formatCurrency(category.budget)}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

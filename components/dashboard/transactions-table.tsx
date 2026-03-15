"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Transaction {
  id: number
  created_at: string
  monto: number
  tipo: string
  categoria: string
  descripcion: string
}

export function TransactionsTable({ cardColor, textColor }: { cardColor?: string, textColor?: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const supabase = createClient()

  // 1. Función para asignar colores vivos a las categorías
  const getCategoryStyle = (category: string) => {
    const colors: { [key: string]: string } = {
      Sueldo: "bg-emerald-100 text-emerald-700 border-emerald-200",
      Trading: "bg-blue-100 text-blue-700 border-blue-200",
      Cena: "bg-orange-100 text-orange-700 border-orange-200",
      Mercado: "bg-purple-100 text-purple-700 border-purple-200",
      Transporte: "bg-slate-100 text-slate-700 border-slate-200",
      Ocio: "bg-pink-100 text-pink-700 border-pink-200",
      Restaurante: "bg-amber-100 text-amber-700 border-amber-200",
    }
    // Si la categoría no está en la lista, da un color gris suave por defecto
    return colors[category] || "bg-gray-100 text-gray-700 border-gray-200"
  }

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data } = await supabase
        .from("transacciones")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8)
      
      if (data) setTransactions(data)
    }
    fetchTransactions()
  }, [supabase])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card style={{ backgroundColor: cardColor, color: textColor }}>
      <CardHeader>
        <CardTitle>Transacciones Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ color: textColor }}>Fecha</TableHead>
              <TableHead style={{ color: textColor }}>Monto</TableHead>
              <TableHead style={{ color: textColor }}>Categoría</TableHead>
              <TableHead style={{ color: textColor }}>Descripción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center opacity-50">No hay transacciones aún</TableCell>
              </TableRow>
            ) : (
              transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs">
                    {new Date(t.created_at).toLocaleDateString('es-CO')}
                  </TableCell>
                  <TableCell className={cn(
                    "font-medium",
                    // Se asegura de comparar ignorando espacios
                    t.tipo?.trim() === "Ingreso" ? "text-emerald-500" : "text-red-500"
                  )}>
                    {t.tipo?.trim() === "Ingreso" ? "+" : "-"} {formatCurrency(t.monto)}
                  </TableCell>
                  <TableCell>
                    {/* 2. Etiqueta con color dinámico */}
                    <span className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-bold border",
                      getCategoryStyle(t.categoria)
                    )}>
                      {t.categoria || "General"}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate text-sm">
                    {t.descripcion}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

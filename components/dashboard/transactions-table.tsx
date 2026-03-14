"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ArrowUpRight, ArrowDownLeft } from "lucide-react"

interface Transaction {
  id: string
  date: string
  displayDate: string
  amount: number
  type: "income" | "expense"
  category: string
  description: string
}

const sampleTransactions: Transaction[] = [
  {
    id: "1",
    date: "2024-03-14",
    displayDate: "14 mar 2024",
    amount: 2500000,
    type: "income",
    category: "Salario",
    description: "Pago mensual - Empresa ABC",
  },
  {
    id: "2",
    date: "2024-03-13",
    displayDate: "13 mar 2024",
    amount: 85000,
    type: "expense",
    category: "Alimentación",
    description: "Compras supermercado",
  },
  {
    id: "3",
    date: "2024-03-12",
    displayDate: "12 mar 2024",
    amount: 350000,
    type: "expense",
    category: "Servicios",
    description: "Pago arriendo mensual",
  },
  {
    id: "4",
    date: "2024-03-11",
    displayDate: "11 mar 2024",
    amount: 150000,
    type: "income",
    category: "Freelance",
    description: "Proyecto diseño web",
  },
  {
    id: "5",
    date: "2024-03-10",
    displayDate: "10 mar 2024",
    amount: 45000,
    type: "expense",
    category: "Transporte",
    description: "Recarga tarjeta metro",
  },
  {
    id: "6",
    date: "2024-03-09",
    displayDate: "09 mar 2024",
    amount: 120000,
    type: "expense",
    category: "Entretenimiento",
    description: "Cena restaurante",
  },
  {
    id: "7",
    date: "2024-03-08",
    displayDate: "08 mar 2024",
    amount: 200000,
    type: "income",
    category: "Inversiones",
    description: "Dividendos acciones",
  },
]

interface TransactionsTableProps {
  transactions?: Transaction[]
  cardColor?: string
  textColor?: string
}

export function TransactionsTable({
  transactions = sampleTransactions,
  cardColor,
  textColor,
}: TransactionsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className="border-border" style={{ backgroundColor: cardColor }}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle 
          className="text-lg font-semibold"
          style={{ color: textColor }}
        >
          Transacciones Recientes
        </CardTitle>
        <button 
          className="text-sm hover:underline"
          style={{ color: textColor, opacity: 0.7 }}
        >
          Ver todas
        </button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead style={{ color: textColor, opacity: 0.6 }}>Fecha</TableHead>
                <TableHead style={{ color: textColor, opacity: 0.6 }}>Monto</TableHead>
                <TableHead style={{ color: textColor, opacity: 0.6 }}>Tipo</TableHead>
                <TableHead style={{ color: textColor, opacity: 0.6 }}>Categoría</TableHead>
                <TableHead style={{ color: textColor, opacity: 0.6 }}>Descripción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  className="border-border hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <TableCell className="text-sm" style={{ color: textColor }}>
                    {transaction.displayDate}
                  </TableCell>
                  <TableCell>
                    <div
                      className={cn(
                        "flex items-center gap-1 text-sm font-medium",
                        transaction.type === "income"
                          ? "text-emerald-500"
                          : "text-red-500"
                      )}
                    >
                      {transaction.type === "income" ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4" />
                      )}
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        transaction.type === "income" ? "default" : "secondary"
                      }
                      className={cn(
                        "text-xs font-medium",
                        transaction.type === "income"
                          ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                          : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                      )}
                    >
                      {transaction.type === "income" ? "Ingreso" : "Gasto"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span 
                      className="rounded-md bg-black/5 dark:bg-white/10 px-2 py-1 text-xs"
                      style={{ color: textColor }}
                    >
                      {transaction.category}
                    </span>
                  </TableCell>
                  <TableCell 
                    className="max-w-[200px] truncate text-sm opacity-70"
                    style={{ color: textColor }}
                  >
                    {transaction.description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatMoneda, convertir, type Moneda } from "@/lib/monedas"

interface StatCardProps {
  title: string
  value: string
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon: React.ElementType
  iconColor?: string
  cardColor?: string
  textColor?: string
  primaryColor?: string
  subtitle?: string
  large?: boolean
  valueClassName?: string
}

function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor,
  cardColor,
  textColor,
  subtitle,
  large,
  valueClassName,
}: StatCardProps) {
  return (
    <Card
      className="border-border"
      style={{ backgroundColor: cardColor }}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle
          className="text-sm font-medium opacity-70"
          style={{ color: textColor }}
        >
          {title}
        </CardTitle>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            iconColor
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={cn(large ? "text-3xl md:text-4xl font-black" : "text-2xl font-bold", valueClassName)}
          style={valueClassName ? undefined : { color: textColor }}
        >
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs opacity-60" style={{ color: textColor }}>
            {subtitle}
          </p>
        )}
        {change && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            {changeType === "positive" ? (
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
            ) : changeType === "negative" ? (
              <ArrowDownRight className="h-3 w-3 text-red-500" />
            ) : null}
            <span
              className={cn(
                changeType === "positive" && "text-emerald-500",
                changeType === "negative" && "text-red-500",
                changeType === "neutral" && "opacity-70"
              )}
              style={changeType === "neutral" ? { color: textColor } : undefined}
            >
              {change}
            </span>
            <span className="opacity-60" style={{ color: textColor }}>vs. mes anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface StatsCardsProps {
  totalIncome?: number
  totalExpenses?: number
  currentBalance?: number
  cardColor?: string
  textColor?: string
  primaryColor?: string
  moneda?: Moneda
  tasas?: Record<Moneda, number>
}

export function StatsCards({
  totalIncome = 0,
  totalExpenses = 0,
  currentBalance = 0,
  cardColor,
  textColor,
  primaryColor,
  moneda = "COP",
  tasas = { COP: 1, USD: 0, EUR: 0 },
}: StatsCardsProps) {
  const formatCurrency = (amountCop: number) => formatMoneda(convertir(amountCop, moneda, tasas), moneda)

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Ingresos Totales"
        value={formatCurrency(totalIncome)}
        change="+12.5%"
        changeType="positive"
        icon={TrendingUp}
        iconColor="bg-emerald-500/10 text-emerald-500"
        cardColor={cardColor}
        textColor={textColor}
      />
      <StatCard
        title="Gastos Totales"
        value={formatCurrency(totalExpenses)}
        change="+4.2%"
        changeType="negative"
        icon={TrendingDown}
        iconColor="bg-red-500/10 text-red-500"
        cardColor={cardColor}
        textColor={textColor}
      />
      <StatCard
        title="Balance Acumulado"
        value={formatCurrency(currentBalance)}
        subtitle="Histórico completo — no se reinicia cada mes"
        icon={Wallet}
        iconColor="bg-blue-500/10 text-blue-500"
        cardColor={cardColor}
        textColor={textColor}
        primaryColor={primaryColor}
        large
        valueClassName={currentBalance >= 0 ? "text-emerald-500" : "text-rose-500"}
      />
    </div>
  )
}

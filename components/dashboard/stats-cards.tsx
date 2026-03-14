"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cn } from "@/lib/utils"

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
          className="text-2xl font-bold"
          style={{ color: textColor }}
        >
          {value}
        </div>
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
}

export function StatsCards({
  totalIncome = 4850000,
  totalExpenses = 2340000,
  currentBalance = 2510000,
  cardColor,
  textColor,
  primaryColor,
}: StatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

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
        title="Balance Actual"
        value={formatCurrency(currentBalance)}
        change="+8.3%"
        changeType="positive"
        icon={Wallet}
        iconColor="bg-blue-500/10 text-blue-500"
        cardColor={cardColor}
        textColor={textColor}
        primaryColor={primaryColor}
      />
    </div>
  )
}

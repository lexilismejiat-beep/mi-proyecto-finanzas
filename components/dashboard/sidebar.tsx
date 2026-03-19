"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ArrowUpDown,
  PieChart,
  Settings,
  CreditCard,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Bell,
} from "lucide-react"

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: ArrowUpDown, label: "Transacciones", href: "/dashboard/transacciones" },
  { icon: PieChart, label: "Categorías", href: "/dashboard/categorias" },
  { icon: TrendingUp, label: "Reportes", href: "/dashboard/reportes" },
  { icon: Bell, label: "Recordatorios", href: "/dashboard/recordatorios" },
  { icon: Settings, label: "Configuración", href: "/dashboard/configuracion" },
]

interface SidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
  sidebarColor?: string
}

export function Sidebar({ 
  collapsed: controlledCollapsed, 
  onCollapsedChange,
  mobileOpen = false,
  onMobileOpenChange,
  sidebarColor = "#1f2937"
}: SidebarProps) {
  const pathname = usePathname()
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const collapsed = controlledCollapsed ?? internalCollapsed
  const setCollapsed = onCollapsedChange ?? setInternalCollapsed

  // Calculate if text should be light or dark based on background
  const isLightBackground = isColorLight(sidebarColor)
  const textColor = isLightBackground ? "#1f2937" : "#ffffff"
  const textColorMuted = isLightBackground ? "rgba(31, 41, 55, 0.7)" : "rgba(255, 255, 255, 0.7)"
  const hoverBg = isLightBackground ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.1)"
  const activeBg = isLightBackground ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.15)"
  const borderColor = isLightBackground ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)"

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => onMobileOpenChange?.(false)}
        />
      )}
      
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col transition-all duration-300",
          "hidden lg:flex",
          collapsed ? "lg:w-16" : "lg:w-64",
          mobileOpen && "flex w-64"
        )}
        style={{ 
          backgroundColor: sidebarColor,
          borderRight: `1px solid ${borderColor}`
        }}
      >
        {/* Logo */}
        <div 
          className="flex h-16 items-center gap-3 px-4"
          style={{ borderBottom: `1px solid ${borderColor}` }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold" style={{ color: textColor }}>
              Mis Finanzas
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => onMobileOpenChange?.(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                )}
                style={{
                  backgroundColor: isActive ? activeBg : "transparent",
                  color: isActive ? textColor : textColorMuted,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = hoverBg
                    e.currentTarget.style.color = textColor
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent"
                    e.currentTarget.style.color = textColorMuted
                  }
                }}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Collapse Toggle */}
        <div 
          className="p-3"
          style={{ borderTop: `1px solid ${borderColor}` }}
        >
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
            style={{ color: textColorMuted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = hoverBg
              e.currentTarget.style.color = textColor
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent"
              e.currentTarget.style.color = textColorMuted
            }}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span>Colapsar</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}

// Helper function to determine if a color is light or dark
function isColorLight(color: string): boolean {
  const hex = color.replace("#", "")
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128
}

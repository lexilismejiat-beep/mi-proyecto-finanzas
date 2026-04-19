"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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
  Fingerprint, // Icono para la sección de cédula
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
  { icon: CreditCard, label: "Suscripción", href: "/dashboard/pagos" },
  { icon: Settings, label: "Configuración", href: "/dashboard/configuracion" },
]

interface SidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
  sidebarColor?: string
  userCedula?: string // <--- NUEVA PROP
}

function isColorLight(color: string): boolean {
  if (!color) return false
  const hex = color.replace("#", "")
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128
}

export function Sidebar({ 
  collapsed: controlledCollapsed, 
  onCollapsedChange,
  mobileOpen = false,
  onMobileOpenChange,
  sidebarColor: propColor = "#1f2937",
  userCedula // <--- RECIBIMOS LA CÉDULA
}: SidebarProps) {
  const pathname = usePathname()
  const supabase = createClientComponentClient()
  
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const [dbSidebarColor, setDbSidebarColor] = useState(propColor)
  
  const collapsed = controlledCollapsed ?? internalCollapsed
  const setCollapsed = onCollapsedChange ?? setInternalCollapsed

  useEffect(() => {
    const fetchSidebarSettings = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('sidebar_color')
          .eq('id', session.user.id)
          .single()
        
        if (data?.sidebar_color) {
          setDbSidebarColor(data.sidebar_color)
        }
      }
    }
    fetchSidebarSettings()
  }, [supabase])

  const activeColor = dbSidebarColor
  const isLight = isColorLight(activeColor)
  
  const textColor = isLight ? "#111827" : "#ffffff"
  const textColorMuted = isLight ? "rgba(17, 24, 39, 0.7)" : "rgba(255, 255, 255, 0.7)"
  const hoverBg = isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.1)"
  const activeBg = isLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.15)"
  const borderColor = isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)"

  return (
    <>
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
          backgroundColor: activeColor,
          borderRight: `1px solid ${borderColor}`
        }}
      >
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

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => onMobileOpenChange?.(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? activeBg : "transparent",
                  color: isActive ? textColor : textColorMuted,
                }}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* --- SECCIÓN DE IDENTIDAD (Donde salía el UUID) --- */}
        {!collapsed && (
          <div className="mx-3 mb-2 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Fingerprint className="h-3 w-3" style={{ color: textColorMuted }} />
              <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: textColorMuted }}>
                ID Fiscal / Cédula
              </span>
            </div>
            <code className="text-xs font-mono font-bold block truncate" style={{ color: textColor }}>
              {userCedula || "No asignada"}
            </code>
          </div>
        )}

        <div 
          className="p-3"
          style={{ borderTop: `1px solid ${borderColor}` }}
        >
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
            style={{ color: textColorMuted }}
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

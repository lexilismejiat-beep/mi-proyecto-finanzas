"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { useThemeSettings } from "@/lib/theme-context"
import { cn } from "@/lib/utils"

export default function PagosDashboardPage() {
  const [pagos, setPagos] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  
  const supabase = createClient()
  const { theme } = useThemeSettings()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Traer perfil para el TopBar
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        setProfile(profileData)

        // Traer historial de pagos
        const { data } = await supabase
          .from("payments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
        
        setPagos(data || [])
      }
    }
    fetchData()
  }, [supabase])

  return (
    <div className="relative min-h-screen w-full" style={{ backgroundColor: theme.background_color || "#F8FAFC" }}>
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
        sidebarColor={theme.sidebar_color || "#FFFFFF"}
      />
      
      <div className={cn(
        "transition-all duration-300 min-h-screen flex flex-col", 
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <TopBar 
          userName={profile?.full_name || "Usuario"} 
          avatarUrl={profile?.avatar_url}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="p-4 md:p-8 flex-1">
          <div className="max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold" style={{ color: theme.text_color || "#1e293b" }}>
                Gestión de Suscripción
              </h1>
              <p className="text-gray-500">Revisa tus facturas y estado de cuenta.</p>
            </header>
            
            <div 
              className="rounded-2xl p-6 shadow-xl border" 
              style={{ 
                backgroundColor: theme.card_color || "#FFFFFF",
                borderColor: "rgba(0,0,0,0.05)"
              }}
            >
              <h2 className="text-lg font-semibold mb-6" style={{ color: theme.text_color }}>
                Historial de Transacciones
              </h2>
              
              {pagos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💳</span>
                  </div>
                  <p className="text-gray-500">No tienes pagos registrados aún.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <th className="py-4 font-medium text-gray-400">Fecha</th>
                        <th className="py-4 font-medium text-gray-400">Referencia</th>
                        <th className="py-4 font-medium text-gray-400">Monto</th>
                        <th className="py-4 font-medium text-gray-400">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagos.map((pago) => (
                        <tr key={pago.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 text-sm" style={{ color: theme.text_color }}>
                            {new Date(pago.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 text-xs font-mono text-gray-400">
                            {pago.id.substring(0, 8)}...
                          </td>
                          <td className="py-4 font-bold" style={{ color: theme.text_color }}>
                            ${pago.amount} USD
                          </td>
                          <td className="py-4">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium",
                              pago.status === 'APPROVED' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            )}>
                              {pago.status === 'APPROVED' ? 'Aprobado' : 'Pendiente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

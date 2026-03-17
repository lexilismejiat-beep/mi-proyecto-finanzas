{/* 4. TABLA CONTABLE DETALLADA */}
<div className="space-y-4 pt-6">
  <h3 className="text-lg font-semibold flex items-center gap-2">
    <TrendingUp size={20} className="text-emerald-500" />
    Listado Detallado de Movimientos
  </h3>
  <div className="overflow-hidden rounded-lg border border-white/10">
    <table className="w-full text-left text-sm border-collapse">
      <thead className="bg-[#18181b] text-gray-400 border-b border-white/10">
        <tr>
          <th className="p-3 font-medium">Fecha</th>
          <th className="p-3 font-medium">Descripción</th>
          <th className="p-3 font-medium">Categoría</th>
          <th className="p-3 font-medium text-right">Monto</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {transactions.map((t) => (
          <tr key={t.id} className="bg-[#121212] hover:bg-white/[0.02] transition-colors">
            <td className="p-3 text-gray-400 whitespace-nowrap">
              {format(new Date(t.created_at), "dd/MM/yyyy")}
            </td>
            {/* CAMBIO AQUÍ: Usamos t.descripcion que es el campo real de tu DB */}
            <td className="p-3 font-medium text-gray-200 min-w-[200px]">
              {t.descripcion || t.nombre || "Sin descripción"}
            </td>
            <td className="p-3">
              <span className="px-2 py-1 rounded-full bg-white/5 text-xs text-gray-400 border border-white/10">
                {t.categoria}
              </span>
            </td>
            <td className={cn(
              "p-3 text-right font-bold tracking-tight",
              t.tipo === "Ingreso" ? "text-emerald-400" : "text-rose-400"
            )}>
              {t.tipo === "Ingreso" ? "+" : "-"}{formatCurrency(t.monto)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {transactions.length === 0 && (
      <div className="p-12 text-center text-gray-500 italic">
        No se encontraron movimientos registrados en este periodo.
      </div>
    )}
  </div>
</div>

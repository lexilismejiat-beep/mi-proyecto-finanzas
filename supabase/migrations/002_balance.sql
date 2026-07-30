-- 002_balance.sql
-- Balance acumulado histórico (no se resetea por mes), a diferencia de
-- ingresos/gastos que sí son mensuales.
--
-- balance = profiles.saldo_inicial
--         + SUM(monto_cop de TODOS los Ingresos, sin filtro de fecha)
--         - SUM(monto_cop de TODOS los Egresos, sin filtro de fecha)
--
-- La suma se hace en Postgres (no trae todas las transacciones al navegador).
-- security invoker: corre con los privilegios de quien llama, respeta la RLS.
-- Idempotente: create or replace + grant se pueden correr más de una vez.

create or replace function get_balance_total()
returns numeric
language sql
stable
security invoker
as $$
  select
    coalesce((select saldo_inicial from profiles where id = auth.uid()), 0)
    + coalesce((
        select sum(
          case
            when tipo = 'Ingreso' then monto_cop
            when tipo = 'Egreso' then -monto_cop
            else 0
          end
        )
        from transacciones
        where user_id = (select cedula from user_profiles where id = auth.uid())
      ), 0);
$$;

grant execute on function get_balance_total() to authenticated;

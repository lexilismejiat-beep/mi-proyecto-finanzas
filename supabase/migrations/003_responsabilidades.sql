-- 003_responsabilidades.sql
-- Checklist de obligaciones mensuales fijas (arriendo, servicios, créditos).
--
-- NOTA DE DISEÑO — por qué esto no es "recordatorios":
-- `recordatorios` está acoplado al bot de notificaciones (telefono_destino,
-- telegram_id, frecuencia) y modela alertas puntuales. `responsabilidades`
-- es un checklist mensual sin notificaciones: marcar/desmarcar registra o
-- revierte un egreso en `transacciones`. Son dominios distintos aunque se
-- parezcan superficialmente (ambos son "cosas que pago cada mes"). Ver
-- AUDITORIA.md: este proyecto ya sufre por tablas que se solaparon sin
-- querer (profiles/user_profiles). Esta nota deja constancia explícita del
-- solape conceptual entre recordatorios y responsabilidades para poder
-- evaluar unificarlas más adelante, sin repetir ese error por accidente.
--
-- Dos tablas, no una: la obligación (`responsabilidades`) es permanente;
-- el pago (`responsabilidades_pagos`) es mensual. Separarlas da historial
-- gratis ("¿pagué el arriendo en marzo?") sin tener que reconstruirlo desde
-- transacciones.
--
-- Estas tablas son nuevas y el bot de Telegram no las toca, así que usan
-- user_uuid (auth.uid()) en vez de la cédula — a diferencia de
-- transacciones/recordatorios, que quedaron atados a la cédula porque el
-- bot ya las usaba así. Es la dirección correcta (ver roadmap 1.2 de
-- AUDITORIA.md) y no rompe nada existente porque no comparte filas con
-- esas tablas.
--
-- Idempotente: se puede correr más de una vez sin romper nada.

-- ============================================================
-- 1. responsabilidades — la obligación, permanente
-- ============================================================

CREATE TABLE IF NOT EXISTS responsabilidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_uuid uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  monto numeric(18,4) NOT NULL,
  moneda text NOT NULL DEFAULT 'COP' CHECK (moneda IN ('COP', 'USD', 'EUR')),
  categoria text,
  dia_vencimiento int CHECK (dia_vencimiento BETWEEN 1 AND 31),
  activa boolean NOT NULL DEFAULT true,
  orden int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE responsabilidades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS responsabilidades_select_own ON responsabilidades;
CREATE POLICY responsabilidades_select_own
  ON responsabilidades
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_uuid);

DROP POLICY IF EXISTS responsabilidades_insert_own ON responsabilidades;
CREATE POLICY responsabilidades_insert_own
  ON responsabilidades
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_uuid);

DROP POLICY IF EXISTS responsabilidades_update_own ON responsabilidades;
CREATE POLICY responsabilidades_update_own
  ON responsabilidades
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_uuid)
  WITH CHECK (auth.uid() = user_uuid);

DROP POLICY IF EXISTS responsabilidades_delete_own ON responsabilidades;
CREATE POLICY responsabilidades_delete_own
  ON responsabilidades
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_uuid);

-- ============================================================
-- 2. responsabilidades_pagos — el pago, uno por periodo
-- ============================================================

CREATE TABLE IF NOT EXISTS responsabilidades_pagos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  responsabilidad_id uuid NOT NULL REFERENCES responsabilidades(id) ON DELETE CASCADE,
  user_uuid uuid NOT NULL,
  periodo text NOT NULL,                   -- 'YYYY-MM'
  pagado boolean NOT NULL DEFAULT false,
  transaccion_id bigint REFERENCES transacciones(id) ON DELETE SET NULL,
  monto_pagado numeric(18,4),
  pagado_at timestamptz,
  UNIQUE (responsabilidad_id, periodo)     -- hace la operación idempotente
);

ALTER TABLE responsabilidades_pagos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS responsabilidades_pagos_select_own ON responsabilidades_pagos;
CREATE POLICY responsabilidades_pagos_select_own
  ON responsabilidades_pagos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_uuid);

DROP POLICY IF EXISTS responsabilidades_pagos_insert_own ON responsabilidades_pagos;
CREATE POLICY responsabilidades_pagos_insert_own
  ON responsabilidades_pagos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_uuid);

DROP POLICY IF EXISTS responsabilidades_pagos_update_own ON responsabilidades_pagos;
CREATE POLICY responsabilidades_pagos_update_own
  ON responsabilidades_pagos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_uuid)
  WITH CHECK (auth.uid() = user_uuid);

DROP POLICY IF EXISTS responsabilidades_pagos_delete_own ON responsabilidades_pagos;
CREATE POLICY responsabilidades_pagos_delete_own
  ON responsabilidades_pagos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_uuid);

-- ============================================================
-- 3. Índices
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_responsabilidades_pagos_user_periodo
  ON responsabilidades_pagos (user_uuid, periodo);

CREATE INDEX IF NOT EXISTS idx_responsabilidades_user_activa
  ON responsabilidades (user_uuid, activa);

-- ============================================================
-- 4. reclamar_pago_responsabilidad — claim atómico del pago del periodo
-- ============================================================
-- Marcar como pagada una responsabilidad implica dos escrituras: crear el
-- egreso en `transacciones` y dejar constancia en `responsabilidades_pagos`.
-- Si esas dos escrituras se hacen como pasos separados desde el cliente,
-- queda una ventana de carrera real: doble click, conexión lenta con
-- reintento, o dos pestañas casi simultáneas podrían pasar ambas la
-- verificación de "¿ya está pagado?" antes de que cualquiera termine de
-- escribir, y terminar creando dos egresos para el mismo periodo. El
-- unique(responsabilidad_id, periodo) por sí solo no alcanza para evitar
-- eso: protege la fila de responsabilidades_pagos, pero no impide un
-- segundo INSERT en transacciones hecho por el intento perdedor.
--
-- Esta función empuja la parte que necesita ser atómica a Postgres: el
-- INSERT ... ON CONFLICT ... WHERE pagado = false es una sola operación a
-- nivel de fila, así que de dos llamadas concurrentes solo una puede
-- "ganar" la transición pagado=false -> true. El cliente crea el egreso en
-- transacciones primero y le pasa el id acá; si la función devuelve NULL
-- (alguien más ya se quedó con el periodo), el cliente borra el egreso que
-- acaba de crear en vez de dejarlo huérfano.
--
-- security invoker: corre con los privilegios de quien llama, respeta la
-- RLS (auth.uid() = user_uuid), igual que las políticas de arriba.
-- Idempotente: create or replace + grant se pueden correr más de una vez.

CREATE OR REPLACE FUNCTION reclamar_pago_responsabilidad(
  p_responsabilidad_id uuid,
  p_periodo text,
  p_transaccion_id bigint,
  p_monto_pagado numeric
)
RETURNS responsabilidades_pagos
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  INSERT INTO responsabilidades_pagos (responsabilidad_id, user_uuid, periodo, pagado, transaccion_id, monto_pagado, pagado_at)
  VALUES (p_responsabilidad_id, auth.uid(), p_periodo, true, p_transaccion_id, p_monto_pagado, now())
  ON CONFLICT (responsabilidad_id, periodo)
  DO UPDATE SET
    pagado = true,
    transaccion_id = excluded.transaccion_id,
    monto_pagado = excluded.monto_pagado,
    pagado_at = excluded.pagado_at
  WHERE responsabilidades_pagos.pagado = false
  RETURNING *;
$$;

GRANT EXECUTE ON FUNCTION reclamar_pago_responsabilidad(uuid, text, bigint, numeric) TO authenticated;

-- 001_multimoneda.sql
-- Soporte multimoneda (COP / USD / EUR) sobre el eje contable COP.
-- COP es el eje contable fijo: cada transacción congela monto_cop al crearse
-- y ese valor nunca se recalcula. Los reportes y totales suman monto_cop.
-- Idempotente: se puede correr más de una vez sin romper nada.

-- ============================================================
-- 1. Tipos de dinero correctos (double precision → numeric)
-- ============================================================

ALTER TABLE transacciones
  ALTER COLUMN monto TYPE numeric(18,4) USING monto::numeric(18,4);

ALTER TABLE recordatorios
  ALTER COLUMN monto TYPE numeric(18,4) USING monto::numeric(18,4);

-- ============================================================
-- 2. Columnas nuevas en transacciones
-- ============================================================

ALTER TABLE transacciones
  ADD COLUMN IF NOT EXISTS moneda text NOT NULL DEFAULT 'COP'
    CHECK (moneda IN ('COP', 'USD', 'EUR'));

ALTER TABLE transacciones
  ADD COLUMN IF NOT EXISTS tasa_a_cop numeric(18,6) NOT NULL DEFAULT 1;

ALTER TABLE transacciones
  ADD COLUMN IF NOT EXISTS monto_cop numeric(18,4);

-- ============================================================
-- 3. Backfill: todo lo existente hoy es COP
-- ============================================================

UPDATE transacciones
SET monto_cop = monto, moneda = 'COP', tasa_a_cop = 1
WHERE monto_cop IS NULL;

-- ============================================================
-- 4. Trigger fill_monto_cop() — crítico para no romper el bot de Telegram.
-- El bot inserta sin conocer moneda/tasa_a_cop/monto_cop. Este trigger
-- rellena esos campos con los valores por defecto (COP, tasa 1) cuando
-- vienen nulos, tanto en INSERT como en UPDATE. Solo rellena monto_cop
-- cuando está vacío: nunca sobrescribe un monto_cop ya congelado.
-- ============================================================

CREATE OR REPLACE FUNCTION fill_monto_cop()
RETURNS trigger AS $$
BEGIN
  IF NEW.moneda IS NULL THEN
    NEW.moneda := 'COP';
  END IF;

  IF NEW.tasa_a_cop IS NULL THEN
    NEW.tasa_a_cop := 1;
  END IF;

  IF NEW.monto_cop IS NULL THEN
    NEW.monto_cop := NEW.monto * NEW.tasa_a_cop;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fill_monto_cop ON transacciones;

CREATE TRIGGER trg_fill_monto_cop
  BEFORE INSERT OR UPDATE ON transacciones
  FOR EACH ROW
  EXECUTE FUNCTION fill_monto_cop();

-- ============================================================
-- 5. Preferencias de moneda y metas en profiles
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS moneda_visualizacion text NOT NULL DEFAULT 'COP'
    CHECK (moneda_visualizacion IN ('COP', 'USD', 'EUR'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS saldo_inicial numeric(18,4) NOT NULL DEFAULT 0;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS meta_mensual numeric(18,4) NOT NULL DEFAULT 0;

-- ============================================================
-- 6. Caché de tasas de cambio
-- ============================================================

CREATE TABLE IF NOT EXISTS tasas_cambio (
  fecha date NOT NULL,
  moneda text NOT NULL,
  tasa_a_cop numeric(18,6) NOT NULL,
  fuente text DEFAULT 'exchangerate-api',
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (fecha, moneda)
);

ALTER TABLE tasas_cambio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tasas_cambio_select_authenticated ON tasas_cambio;
CREATE POLICY tasas_cambio_select_authenticated
  ON tasas_cambio
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS tasas_cambio_insert_authenticated ON tasas_cambio;
CREATE POLICY tasas_cambio_insert_authenticated
  ON tasas_cambio
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- 7. Índices que van a doler cuando crezcan los datos
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_transacciones_user_created
  ON transacciones (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recordatorios_user_fecha
  ON recordatorios (user_id, fecha_vencimiento);

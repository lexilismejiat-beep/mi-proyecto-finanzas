# Auditoría técnica — "Mis Finanzas" (v2, esquema confirmado)

**Fecha:** 30 de julio de 2026
**Stack:** Next.js 16.1.6 (App Router, `output: 'export'`) · React 19 · TypeScript 5.7 · Tailwind v4 · shadcn/ui · Supabase (Auth + Postgres + Storage + Edge Functions) · Capacitor 6 (Android) · GitHub Actions · Wompi (pagos)

> **v2:** incorpora el esquema real de Supabase. Varias hipótesis de la v1 quedaron confirmadas como bugs concretos; otras se corrigieron.
> **Pendiente:** estado de RLS y políticas (`pg_tables.rowsecurity`, `pg_policies`). Sin eso, la sección de seguridad sigue sin poder cerrarse.

---

## 1. Arquitectura real

Dashboard de finanzas personales en español, con **suscripción vía Wompi** y un **bot de Telegram/WhatsApp** que inyecta datos desde fuera de este repo.

Todo el frontend es client-side: cada página es `"use client"`, llama `supabase.auth.getUser()` y consulta Postgres directo desde el navegador. No hay Server Components con datos, ni API routes, ni capa de servicios.

**Distribución:** web en Vercel + APK Android generado por CI (que en realidad es un WebView apuntando a Vercel — ver A2).

### Esquema real en Supabase (`public`)

```
profiles                          ← tabla principal de verdad
  id uuid, cedula text, full_name text, email text, updated_at
  telegram_chat_id text
  avatar_url text, dream text
  theme_name, primary_color, secondary_color, accent_color,
  background_color, text_color, card_color, sidebar_color,
  font_family, font_size text, background_opacity int,
  background_image text, background_image_url text   ← DUPLICADAS
  trial_ends_at, subscription_status, wompi_customer_id

user_profiles                     ← datos personales del onboarding
  id uuid, nombres, apellidos, cedula text, telefono,
  fecha_nacimiento, genero, direccion, ciudad, pais,
  registration_complete bool, telegram_id text,
  primary_color text, updated_at
  ↑ ÚNICA columna de tema que existe aquí

transacciones                     ← alimentada también por el bot
  id bigint, created_at, monto float8, tipo, categoria,
  descripcion, url_factura, user_id TEXT (= cédula), telegram_id

recordatorios
  id bigint, created_at, titulo, descripcion, monto float8,
  fecha_vencimiento date, frecuencia, categoria, estado,
  recordar_dias_antes, user_id TEXT (= cédula),
  telefono_destino, telegram_id, user_nombre

categorias_personalizadas
  id uuid, user_id TEXT (= cédula), nombre, descripcion,
  icon_name, keywords ARRAY, created_at

payments
  id uuid, user_id UUID (= auth.uid), amount numeric,
  status, wompi_id, created_at
```

**Correcciones a la v1:**
- `user_preferences` **no existe**. El script `001_create_profiles.sql` nunca se aplicó completo.
- `registration_complete` **sí existe** en `user_profiles` y coincide con el código. Ese punto estaba OK.
- Ninguna tabla tiene `registration_completed` ni `registro_completado`. El SQL del repo describe una base que no es la tuya.

**Conclusión estructural:** las dos tablas de perfil no son redundantes por accidente, se especializaron — `profiles` es la tabla "de sistema" (tema, suscripción, bot) y `user_profiles` la "de onboarding". El problema es que **el código no respeta esa separación**, y ahí nacen los bugs de abajo.

---

## 2. Bugs CONFIRMADOS (fallas reales, no riesgos teóricos)

### B1 — El tema nunca carga y nunca guarda 🔴

`lib/theme-context.tsx` lee 11 propiedades de tema desde `user_profiles`. Solo **una** existe ahí (`primary_color`). Las otras 10 (`secondary_color`, `accent_color`, `background_color`, `text_color`, `sidebar_color`, `card_color`, `font_family`, `font_size`, `background_image_url`, `background_opacity`) **no son columnas de esa tabla**.

Consecuencias, exactas:
- `loadTheme()` → los 10 campos son `undefined` → cae al `defaultTheme` **siempre**. El tema guardado nunca se aplica al arrancar.
- `updateTheme()` → hace `UPDATE user_profiles SET secondary_color=...` sobre columnas inexistentes → PostgREST devuelve error, que el `try/catch` traga con un `console.error`. **Guardar el tema desde el contexto falla en silencio, el 100 % de las veces.**

El fix es de una línea conceptual: `theme-context` debe leer y escribir en `profiles`, no en `user_profiles`. Ahí sí existen las 11 columnas.

### B2 — El dashboard principal no muestra datos 🔴

`app/dashboard/page.tsx`:
```ts
const { data: profileData } = await supabase.from("profiles").select("*")...
const { data: transData } = await supabase.from("transacciones")
  .select("monto, tipo").eq("user_id", profileData.cedula)
```

Busca la cédula en `profiles.cedula`. Pero **ningún código de este repo escribe jamás `profiles.cedula`**:
- `registro/page.tsx` guarda la cédula en `user_profiles`, y en `profiles` solo escribe colores.
- `configuracion/page.tsx` guarda cédula en `user_profiles`, y en `profiles` solo `avatar_url`, `dream`, `full_name`.

Si `profiles.cedula` está vacía, la query filtra por `null` y **los totales del mes salen en cero**. El resto de páginas (transacciones, reportes, recordatorios, categorías) usan `user_profiles.cedula`, que sí se llena — por eso ahí sí ves datos y en el home no.

> Verificar: puede que el bot de Telegram rellene `profiles.cedula` por fuera. Aun así, dos columnas `cedula` en dos tablas que se pueden desincronizar es una bomba de tiempo.

### B3 — El tamaño de fuente produce `16pxpx` 🟠

- `registro/page.tsx` escribe `font_size: "16px"` en `profiles`.
- `theme-context.tsx` tiene por defecto `font_size: "16"`.
- `applyThemeToDOM()` hace `` `${theme.font_size}px` ``.

Cuando el valor viene de la base → `"16px" + "px"` = `"16pxpx"` → CSS inválido, el navegador lo ignora. `font_size` debería ser `integer` en la base y el `px` añadirse solo en el render.

### B4 — Columna de imagen de fondo duplicada 🟠

`profiles` tiene **`background_image` y `background_image_url`**, las dos. `theme-customizer.tsx` escribe en `background_image`; `theme-context.tsx` lee `background_image_url`. Aunque arregles B1, la imagen de fondo seguiría sin cargar. Hay que consolidar en una sola columna y migrar los datos.

### B5 — La suscripción no bloquea nada 🔴 (crítico de negocio)

`profiles` tiene `subscription_status`, `trial_ends_at` y `wompi_customer_id`; existe la tabla `payments` con `wompi_id`; y `pagos-section.tsx` muestra un badge ACTIVO/INACTIVO y el widget de checkout de Wompi.

Pero **nada en el código verifica el estado de suscripción antes de dar acceso**. `AuthWrapper` solo comprueba sesión + `registration_complete`. Un usuario con `subscription_status = null` y trial vencido entra a `/dashboard` y usa todo sin límite, indefinidamente.

El paywall hoy es decorativo. Y como es un cliente estático (ver C6), el gate no puede vivir solo en el frontend: tiene que apoyarse en RLS o en la Edge Function.

### B6 — Los montos son `double precision` 🟠

`transacciones.monto` y `recordatorios.monto` son float. Para dinero eso acumula error de redondeo (el clásico `0.1 + 0.2`). En COP con montos grandes y sumas repetidas en los reportes, los totales se desvían. `payments.amount` sí es `numeric` — o sea, la decisión correcta ya está tomada en una tabla y no en las otras. Migrar a `numeric(14,2)`.

---

## 3. Riesgos de SEGURIDAD (pendientes de confirmar RLS)

### S1 — Aislamiento por cédula, no por UUID 🔴

`transacciones`, `recordatorios` y `categorias_personalizadas` usan `user_id text` = **número de cédula**.

Entiendo *por qué*: el bot de Telegram identifica al usuario por cédula, no tiene el UUID de auth. Es una decisión con lógica detrás. Pero una cédula es corta, adivinable y enumerable, mientras un UUID no. Si la RLS de esas tablas es permisiva, cambiar un valor en el cliente basta para leer los movimientos de otra persona.

**Solución compatible con el bot:** añadir `user_uuid uuid` a las tres tablas, rellenarla vía join por cédula, poner la RLS sobre `user_uuid`, y dejar que el bot siga escribiendo la cédula (un trigger `BEFORE INSERT` resuelve el `user_uuid`). Así no rompes la integración existente.

### S2 — Queries sin filtro de usuario 🔴

- `pagos-section.tsx`: `.from('payments').select('*')` — **sin `.eq('user_id', ...)`**. Depende por completo de RLS.
- `handleEliminar` en transacciones, recordatorios y categorías: `.delete().eq('id', id)` — sin filtro de dueño. Como `transacciones.id` y `recordatorios.id` son `bigint` secuenciales (enumerables), con RLS débil se puede borrar el registro de cualquiera adivinando un número.

### S3 — El middleware no se ejecuta nunca 🔴

`middleware.ts` + `lib/supabase/middleware.ts` implementan protección de rutas server-side. Pero `output: 'export'` **desactiva el middleware en Next.js**, tanto en Vercel como en el APK. `lib/supabase/server.ts` tampoco se importa en ningún lado (usa `cookies()`, imposible en estático).

Es código muerto que da una falsa sensación de seguridad. **Tu única defensa real es la RLS de Postgres** — lo que hace que S1 y S2 pesen mucho más.

### S4 — Edge Function sin autenticación aparente 🟠

```ts
fetch(`https://rdyaeslcznsynfgowutw.supabase.co/functions/v1/rapid-handler?type=telegram&userId=${profile.cedula}`)
```

URL hardcodeada, cédula en la query string, sin header `Authorization`, y sin revisar la respuesta (se muestra "✅ enviado" pase lo que pase). Si `rapid-handler` no valida el JWT, cualquiera puede disparar mensajes a la cédula que quiera.

---

## 4. Deuda de INFRAESTRUCTURA

### A1 — Dos clientes Supabase distintos 🟠
`sidebar.tsx` y `pagos-section.tsx` usan `createClientComponentClient` de `@supabase/auth-helpers-nextjs` (**deprecado**); el resto usa `createBrowserClient` de `@supabase/ssr`. Manejan el storage de sesión distinto → desincronización, sidebar que no carga color, "usuario no encontrado" intermitente.

### A2 — El APK no es lo que parece 🟠
El CI **sobrescribe `capacitor.config.json`** antes de compilar y le mete `"server": { "url": "https://mis-finanzas-kappa.vercel.app" }`. El APK es un WebView remoto; el `out/` que Next genera **nunca se usa**. Implicaciones: sin internet no abre, no hay offline, y el `output: 'export'` (que es lo que te rompe el middleware) no está aportando nada.

### A3 — `sed` frágil sobre el AndroidManifest 🟠
`sed -i "s|</activity>|MARKER</activity>|g"` aplica a **todas** las `</activity>`. Hoy funciona porque hay una sola; con el primer plugin que traiga activity propia, se rompe en silencio.

### A4 — APK sin firmar 🟠
`assembleDebug -x lint`. No es publicable en Play Store, y `-x lint` esconde problemas.

### A5 — Builds no reproducibles 🟠
`npm install --no-package-lock --legacy-peer-deps`. Sin lockfile, cada build resuelve versiones distintas.

### A6 — El compilador está apagado 🔴
`typescript: { ignoreBuildErrors: true }` + `any` en 10 archivos + sin tipos generados de Supabase. Justo lo que habría atrapado B1 y B2 antes de desplegar.

### A7 — `/auth/callback` figura como ruta pública pero no existe
Residuo en `publicPaths` de `auth-wrapper` y del middleware muerto.

---

## 5. Calidad y mantenibilidad

| # | Problema | Dónde |
|---|---|---|
| M1 | **15 fuentes de Google** cargadas en el layout raíz, siempre, para todos | `app/layout.tsx` |
| M2 | `globals.css` duplicado con contenido divergente | `app/` vs `styles/` |
| M3 | Hooks duplicados **byte a byte** | `hooks/use-toast.ts` = `components/ui/use-toast.ts`; ídem `use-mobile` |
| M4 | Sin capa de datos: queries repetidas dentro de cada componente | transversal |
| M5 | El perfil se re-consulta en cada página (getUser + 2 queries) | todas las de dashboard |
| M6 | `formatCurrency` reescrito idéntico en 4+ archivos | transversal |
| M7 | `confirm()` nativo para borrar, teniendo `AlertDialog` instalado | transacciones, recordatorios |
| M8 | `window.location.href` fuerza recarga completa | `CapacitorAuthHandler.tsx` |
| M9 | 16 `console.*` que llegan a producción | transversal |
| M10 | `useEffect` con dependencias faltantes (`publicPaths` se recrea cada render) | `auth-wrapper.tsx` |
| M11 | `parseFloat` sin validar → `monto` puede quedar `NaN` | `transacciones/page.tsx` |
| M12 | Detección de app nativa por heurística de URL frágil | `login/page.tsx` |
| M13 | `manifest.json`: `192x192` y `512x512` apuntan al mismo `logo.png` | `public/` |
| M14 | Años hardcodeados `[2024, 2025, 2026]` | `transacciones/page.tsx` |
| M15 | `telegram_id` en 3 tablas + `telegram_chat_id` en `profiles` — 4 nombres para lo mismo | esquema |
| M16 | Sin `README`, `.env.example`, config de ESLint (pese al script `lint`), ni tests | raíz |
| M17 | `components.json` con `"rsc": true` pero no hay un solo Server Component | raíz |
| M18 | ~40 componentes shadcn instalados sin usar | `components/ui/` |
| M19 | Los scripts SQL del repo describen una base que no existe → borrarlos o regenerarlos | `scripts/` |

---

## 6. Lo que está bien

- La separación conceptual `profiles` (sistema) / `user_profiles` (onboarding) es defendible; el problema es que el código no la respeta.
- `payments.amount` es `numeric` — la decisión correcta para dinero ya está tomada ahí.
- Integración con el bot pensada de punta a punta (`telegram_id` y `url_factura` en `transacciones` indican captura automática de gastos, incluso con foto de factura). Es la parte más valiosa del producto.
- `AuthWrapper` centraliza el gate de auth en un solo lugar — la base correcta para agregarle el check de suscripción.
- UI sólida y realmente responsive (hay tratamiento explícito móvil/escritorio, no solo breakpoints).
- Localización cuidada: `date-fns` con locale `es`, `Intl.NumberFormat("es-CO")`.
- CI que automatiza el build de APK sin intervención manual: frágil, pero resuelve un problema real.

---

## 7. Plan priorizado

### Fase 0 — Cerrar el diagnóstico (bloqueante)
0.1 Obtener estado de RLS y políticas de las 6 tablas.
0.2 Revisar si la Edge Function `rapid-handler` valida el JWT.
0.3 Confirmar si el bot rellena `profiles.cedula`.

### Fase 1 — Seguridad
1.1 RLS correcta en las 6 tablas, basada en `auth.uid()`.
1.2 Añadir `user_uuid` a `transacciones`, `recordatorios`, `categorias_personalizadas`; backfill por cédula; trigger para el bot; RLS sobre `user_uuid`.
1.3 Filtro de usuario en `pagos-section.tsx` y en los tres `handleEliminar`.
1.4 Blindar `rapid-handler`.

### Fase 2 — Bugs confirmados
2.1 `theme-context` → apuntar a `profiles` (arregla B1).
2.2 Unificar `background_image` / `background_image_url` (B4).
2.3 `font_size` → `integer`, `px` solo en render (B3).
2.4 Una sola fuente para la cédula; arreglar el dashboard home (B2).
2.5 `monto` → `numeric(14,2)` en `transacciones` y `recordatorios` (B6).

### Fase 3 — Suscripción
3.1 Check de `subscription_status` / `trial_ends_at` en `AuthWrapper` + pantalla de bloqueo.
3.2 Reforzar el gate en RLS o Edge Function (el cliente estático no es confiable).
3.3 Webhook de Wompi que actualice `subscription_status` (verificar que exista).

### Fase 4 — Limpieza estructural
4.1 Borrar código muerto: `middleware.ts`, `lib/supabase/middleware.ts`, `lib/supabase/server.ts`, `styles/globals.css`, hooks duplicados, `scripts/*.sql` obsoletos.
4.2 Un solo cliente Supabase; desinstalar `auth-helpers-nextjs`.
4.3 `supabase gen types typescript` → eliminar los `any` → quitar `ignoreBuildErrors`.
4.4 `ProfileContext` + `lib/queries/` + `lib/format.ts`.
4.5 Reducir a 2-3 fuentes.

### Fase 5 — Build y distribución
5.1 Commitear `package-lock.json`, CI con `npm ci`.
5.2 Una sola fuente de verdad para la config de Capacitor; decidir WebView remoto vs export estático conscientemente.
5.3 Manifest de Android versionado en el repo en vez del `sed`.
5.4 Firma de release + `assembleRelease`.

### Fase 6 — Higiene
6.1 ESLint + Prettier en CI. 6.2 `README.md` + `.env.example`. 6.3 Logger que se calle en producción. 6.4 `AlertDialog` en vez de `confirm()`. 6.5 Purgar shadcn sin usar.

# Mis Finanzas

Aplicación de finanzas personales construida con Next.js y Supabase, empaquetada como app Android con Capacitor.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Supabase** (`@supabase/ssr`, `@supabase/supabase-js`) — base de datos, auth y backend
- **Tailwind CSS 4** + Radix UI + shadcn/ui
- **Capacitor 6** — empaquetado nativo para Android
- Despliegue web en Vercel

## Requisitos

- Node.js 20+
- npm
- Cuenta y proyecto de Supabase

## Levantar el proyecto en local

```bash
npm install
cp .env.example .env.local
# completar .env.local con tus credenciales de Supabase
npm run dev
```

La app queda disponible en `http://localhost:3000`.

Otros scripts disponibles:

```bash
npm run build   # build de producción
npm run start   # levantar el build de producción
npm run lint    # linter
```

## Variables de entorno

Definidas en `.env.example`. Copiar a `.env.local` (no se sube a git) y completar con los valores del proyecto de Supabase (Project Settings → API):

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (pública) de Supabase |

## Generar el APK

El APK de Android se genera automáticamente vía GitHub Actions (`.github/workflows/android.yml`) en cada push a `main` o `develop`, y en cada pull request hacia `develop`. El workflow:

1. Instala dependencias y hace el build de Next.js (export estático).
2. Genera los assets nativos de Android con `@capacitor/assets`.
3. Inicializa el proyecto Capacitor y sincroniza (`npx cap sync android`).
4. Compila el APK debug con Gradle.
5. Sube el APK como artefacto del workflow (`MisFinanzas-<rama>-<sha>`), descargable desde la pestaña **Actions** del run correspondiente.

Para generarlo manualmente en local hace falta tener Android SDK/Gradle configurado; ver los pasos equivalentes en `.github/workflows/android.yml`.

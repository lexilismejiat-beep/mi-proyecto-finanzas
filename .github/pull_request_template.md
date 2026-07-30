## Qué cambia

<!-- Describe brevemente el cambio y por qué es necesario -->

## Cómo probarlo

<!-- Pasos para que el revisor pueda probar el cambio localmente -->

1.
2.
3.

## SQL a correr en Supabase (si aplica)

<!-- Si este PR requiere migraciones, cambios de esquema, RLS, etc.,
     pega aquí el SQL exacto a ejecutar en Supabase antes o después del deploy.
     Si no aplica, escribe "No aplica". -->

```sql

```

## Checklist de revisión

- [ ] El código compila y pasa `npm run lint`
- [ ] Probado en local (`npm run dev`)
- [ ] No incluye archivos generados (`node_modules/`, `.next/`, `android/`, `ios/`, `assets/`)
- [ ] No incluye secretos ni credenciales
- [ ] Si hay cambios de base de datos, el SQL de arriba fue revisado
- [ ] La rama sigue la convención `feature/`, `fix/` o `chore/`
- [ ] Los commits siguen Conventional Commits

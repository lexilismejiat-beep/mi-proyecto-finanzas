# Contribuir

## Flujo de ramas

```
feature/*  →  develop  →  main
fix/*      →  develop  →  main
chore/*    →  develop  →  main
```

- **`main`**: rama de producción. Siempre debe estar estable y desplegable.
- **`develop`**: rama de integración. Todo el trabajo en curso pasa por aquí antes de llegar a `main`.
- **`feature/*`, `fix/*`, `chore/*`**: ramas de trabajo, creadas desde `develop`.

### Nombres de rama

- `feature/<descripcion-corta>` — nueva funcionalidad. Ej: `feature/reportes-mensuales`
- `fix/<descripcion-corta>` — corrección de bug. Ej: `fix/error-login-google`
- `chore/<descripcion-corta>` — tareas de mantenimiento (deps, config, CI). Ej: `chore/actualizar-workflow`

### Proceso

1. Crear la rama desde `develop` actualizado:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/mi-cambio
   ```
2. Hacer commits siguiendo Conventional Commits (ver abajo).
3. Abrir un Pull Request hacia `develop` (no hacia `main`).
4. Completar la plantilla del PR, incluyendo el SQL de Supabase si aplica.
5. Una vez aprobado y verde en CI, mergear a `develop`.
6. Periódicamente, `develop` se mergea a `main` para release.

## Conventional Commits

Formato: `<tipo>(<alcance opcional>): <descripción>`

Tipos más comunes:

- `feat`: nueva funcionalidad
- `fix`: corrección de bug
- `chore`: mantenimiento, config, dependencias
- `refactor`: cambio de código sin alterar comportamiento
- `docs`: documentación
- `style`: formato, sin cambios de lógica
- `test`: agregar o corregir tests

Ejemplos:

```
feat(reportes): agregar filtro por rango de fechas
fix(auth): corregir redirección tras login con Google
chore(ci): incluir SHA en el nombre del artefacto de Android
```

# OpsFlow - Plan de Ejecución

## FASE 1 — DEFINICIÓN DEL PRODUCTO

**OpsFlow** - Sistema de Gestión de Incidencias Operativas para Equipos de Ingeniería

Es una herramienta SaaS interna para gestionar el ciclo de vida completo de incidencias operativas: desde que se reporta un incidente hasta su resolución, con trazabilidad completa, asignación clara y visibilidad para managers.

## FASE 2 — STACK TÉCNICO

| Capa | Tecnología |
|------|-------------|
| Frontend | Angular 17+ (standalone, signals, ts/scss/html separados) |
| UI | Angular Material |
| Backend | .NET 8 Web API |
| ORM | Entity Framework Core |
| Database | PostgreSQL |
| Auth | JWT (Bearer) |
| Infra | Docker + Docker Compose |

## FASE 3 — ENTIDADES PRINCIPALES

- **Organization**: Organización/tenant
- **User**: Usuarios con roles (Admin, Manager, Contributor, Viewer)
- **Team**: Equipos dentro de una organización
- **Incident**: Incidencias con estados (New ? Assigned ? InProgress ? Resolved ? Closed)
- **Comment**: Comentarios en incidencias
- **AuditLog**: Historial de cambios

## FASE 4 — ROLES Y PERMISOS

| Rol | Crear | Editar | Asignar | Gestionar Usuarios | Ver Auditoría |
|-----|-------|--------|---------|---------------------|---------------|
| Admin | ? | ? | ? | ? | ? |
| Manager | ? | ? | ? | ? | ? |
| Contributor | ? | Propias | ? | ? | ? |
| Viewer | ? | ? | ? | ? | ? |

## FASE 5 — FUNCIONALIDADES MVP

- Login/Logout con JWT
- Dashboard con estadísticas
- CRUD de incidencias
- Cambio de estados con transiciones válidas
- Asignación a usuarios
- Comentarios
- Filtros y búsqueda
- Gestión de equipos
- Gestión de usuarios (Admin)
- Auditoría de cambios

## FASE 6 — ESTRUCTURA DE CARPETAS

`
opsflow/
+-- opsflow-api/           # .NET 8 Web API
¦   +-- src/
¦   ¦   +-- OpsFlow.Api/           # Controllers, DTOs, Middleware
¦   ¦   +-- OpsFlow.Application/   # Services, Validators
¦   ¦   +-- OpsFlow.Domain/        # Entities, Enums, Interfaces
¦   ¦   +-- OpsFlow.Infrastructure/ # EF Core, Repositories
¦   +-- tests/
+-- opsflow-web/           # Angular
¦   +-- src/
¦   ¦   +-- app/
¦   ¦   ¦   +-- core/       # Services, guards, interceptors
¦   ¦   ¦   +-- shared/     # Components compartidos
¦   ¦   ¦   +-- features/   # Módulos por feature
¦   ¦   +-- styles/
¦   +-- ...
+-- docker-compose.yml
+-- .env.example
+-- README.md
`

## FASE 7 — PLAN DE EJECUCIÓN

1. Setup inicial (2h)
2. Dominio y base de datos (4h)
3. Auth y seguridad (4h)
4. API de incidencias (6h)
5. Workflow y RBAC (4h)
6. Auditoría (2h)
7. Frontend base (4h)
8. UI de incidencias (8h)
9. Dashboard (2h)
10. Testing (4h)
11. Docker y deploy (2h)
12. Documentación (2h)

**Total estimado**: ~42 horas

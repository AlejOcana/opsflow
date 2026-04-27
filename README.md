# OpsFlow - Incident Management System

A full-stack incident management system for engineering teams, demonstrating senior-level architecture, RBAC security, and clean API design.

## Overview

OpsFlow is a SaaS internal tool for managing operational incidents through their complete lifecycle—from creation to resolution—with full audit trails, role-based access control, and professional-grade architecture.

## Problem Solved

Engineering teams need structured incident tracking without enterprise tool complexity. OpsFlow provides:
- Workflow with valid state transitions
- Role-based permissions (Admin, Manager, Contributor, Viewer)
- Full audit trail of changes
- Clean REST API with proper error handling

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | .NET 8 Web API |
| ORM | Entity Framework Core 8 |
| Database | PostgreSQL |
| Auth | JWT Bearer |
| Frontend | Angular 17 (standalone components) |
| UI | Angular Material |
| Infra | Docker + Docker Compose |

## Architecture

Clean Architecture with 4 layers:
- **Domain**: Entities, Enums, Interfaces
- **Application**: Services, DTOs, Validators  
- **Infrastructure**: EF Core, Repositories
- **API**: Controllers, Middleware

### Key Architectural Decisions

1. **Repository Pattern**: Isolates data access, enables testing
2. **Domain-Driven Design**: Entities encapsulate business rules
3. **JWT Stateless Auth**: Suitable for SPA architectures
4. **Audit Logging**: JSON storage for change history

## Domain Model

```
Organization (1) ───< (N) User
Organization (1) ───< (N) Incident
Organization (1) ───< (N) Team
Incident (1) ───< (N) Comment
Incident (1) ───< (N) AuditLog
```

### Workflow States
```
New → Assigned → InProgress → Resolved → Closed
```

### Role Permissions

| Action | Admin | Manager | Contributor | Viewer |
|--------|-------|---------|-------------|--------|
| Create incidents | ✓ | ✓ | ✓ | ✗ |
| Assign incidents | ✓ | ✓ | ✗ | ✗ |
| Change status | ✓ | ✓ | ✓* | ✗ |
| Manage users | ✓ | ✗ | ✗ | ✗ |
| View audit | ✓ | ✓ | ✗ | ✗ |

*Only own assigned incidents

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Current user info

### Incidents
- `GET /api/incidents` - List with pagination/filters
- `POST /api/incidents` - Create
- `GET /api/incidents/{id}` - Get by ID
- `PUT /api/incidents/{id}` - Update
- `PATCH /api/incidents/{id}/status` - Change status
- `PATCH /api/incidents/{id}/assign` - Assign
- `GET /api/incidents/{id}/history` - Audit history

### Teams & Users
- CRUD operations with role-based authorization

## Running Locally

### Prerequisites
- .NET 8 SDK
- Node.js 20+
- Docker Desktop

### Quick Start

```bash
# Start all services
docker-compose up --build

# Or manually:
# 1. Start PostgreSQL
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16

# 2. Start API
cd opsflow-api && dotnet run

# 3. Start Frontend  
cd opsflow-web && pnpm start
```

### Demo Credentials
```
admin@opsflow.io / admin123
manager@opsflow.io / manager123  
dev@opsflow.io / dev123
```

## Environment Variables

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=opsflow
DB_USER=postgres
DB_PASSWORD=postgres
Jwt__Key=your-secret-key
Jwt__Issuer=opsflow-api
Jwt__Audience=opsflow-web
```

## Security Features

- Password hashing with BCrypt
- JWT tokens with 24h expiration
- Role-based authorization policies
- Organization-level data isolation
- Input validation with FluentValidation
- Audit logging of all changes

## Testing

```bash
cd opsflow-api
dotnet test
```

## Trade-offs

1. **No real-time updates**: Uses manual refresh instead of WebSockets
2. **No multi-tenant isolation**: Single org = single schema
3. **Basic search**: LIKE queries, no full-text search
4. **No migrations**: Uses EnsureCreated for MVP

## What This Demonstrates

This project showcases senior-level competencies:

### Architecture
- Clean separation of concerns
- Repository pattern with EF Core
- Domain-driven design with business rules

### Security  
- JWT authentication with roles
- RBAC with authorization policies
- Organization-level isolation

### API Design
- RESTful endpoints with proper HTTP methods
- Consistent error responses
- Pagination and filtering
- DTOs for request/response

### Full-Stack
- Angular 17 with standalone components
- Signal-based reactivity
- Service layer pattern
- HTTP interceptors

### Professional Practices
- Audit logging
- Serilog structured logging
- Docker containerization
- Seed data for demos

## License

MIT

## Author

Alejandro Ocaña - Senior Full-Stack Engineer
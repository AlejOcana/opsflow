using OpsFlow.Domain.Entities;
using OpsFlow.Domain.Enums;
using OpsFlow.Infrastructure.Data;
using BC = BCrypt.Net.BCrypt;

namespace OpsFlow.Infrastructure.Data;

public class DataSeeder
{
    private readonly OpsFlowDbContext _context;

    public DataSeeder(OpsFlowDbContext context) { _context = context; }

    public async Task SeedAsync()
    {
        if (_context.Organizations.Any()) return;

        var org = new Organization { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), Name = "Acme Corp", Slug = "acme", CreatedAt = DateTime.UtcNow, IsActive = true };
        _context.Organizations.Add(org);

        var team1 = new Team { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Name = "Platform Engineering", Description = "Infrastructure and platform services", OrganizationId = org.Id, CreatedAt = DateTime.UtcNow, IsActive = true };
        var team2 = new Team { Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), Name = "Backend Services", Description = "Backend API development", OrganizationId = org.Id, CreatedAt = DateTime.UtcNow, IsActive = true };
        _context.Teams.AddRange(team1, team2);

        var users = new[]
        {
            new User { Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), Email = "admin@opsflow.io", PasswordHash = BC.HashPassword("admin123"), FirstName = "Alice", LastName = "Admin", Role = UserRole.Admin, OrganizationId = org.Id, TeamId = team1.Id, CreatedAt = DateTime.UtcNow, IsActive = true },
            new User { Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), Email = "manager@opsflow.io", PasswordHash = BC.HashPassword("manager123"), FirstName = "Bob", LastName = "Manager", Role = UserRole.Manager, OrganizationId = org.Id, TeamId = team1.Id, CreatedAt = DateTime.UtcNow, IsActive = true },
            new User { Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"), Email = "dev@opsflow.io", PasswordHash = BC.HashPassword("dev123"), FirstName = "Charlie", LastName = "Developer", Role = UserRole.Contributor, OrganizationId = org.Id, TeamId = team2.Id, CreatedAt = DateTime.UtcNow, IsActive = true },
            new User { Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"), Email = "viewer@opsflow.io", PasswordHash = BC.HashPassword("viewer123"), FirstName = "Diana", LastName = "Viewer", Role = UserRole.Viewer, OrganizationId = org.Id, CreatedAt = DateTime.UtcNow, IsActive = true }
        };
        _context.Users.AddRange(users);

        var incidents = new[]
        {
            new Incident { Id = Guid.NewGuid(), Title = "Database connection timeout", Description = "Production database experiencing intermittent connection timeouts during peak hours.", Status = IncidentStatus.New, Priority = IncidentPriority.Critical, OrganizationId = org.Id, CreatedByUserId = users[0].Id, AssignedToUserId = users[2].Id, TeamId = team2.Id, CreatedAt = DateTime.UtcNow.AddHours(-2) },
            new Incident { Id = Guid.NewGuid(), Title = "API rate limiting not working", Description = "Rate limiter middleware is not correctly enforcing limits on public API endpoints.", Status = IncidentStatus.InProgress, Priority = IncidentPriority.High, OrganizationId = org.Id, CreatedByUserId = users[1].Id, AssignedToUserId = users[2].Id, TeamId = team2.Id, CreatedAt = DateTime.UtcNow.AddDays(-1) },
            new Incident { Id = Guid.NewGuid(), Title = "Update monitoring dashboards", Description = "Grafana dashboards need updated metrics after the new service deployment.", Status = IncidentStatus.Resolved, Priority = IncidentPriority.Medium, OrganizationId = org.Id, CreatedByUserId = users[0].Id, AssignedToUserId = users[1].Id, TeamId = team1.Id, CreatedAt = DateTime.UtcNow.AddDays(-3), ResolvedAt = DateTime.UtcNow.AddDays(-1) },
            new Incident { Id = Guid.NewGuid(), Title = "Deploy CI/CD pipeline improvements", Description = "Optimize build pipeline to reduce deployment time by 50%.", Status = IncidentStatus.Assigned, Priority = IncidentPriority.Low, OrganizationId = org.Id, CreatedByUserId = users[1].Id, AssignedToUserId = users[2].Id, TeamId = team1.Id, CreatedAt = DateTime.UtcNow.AddDays(-5) },
            new Incident { Id = Guid.NewGuid(), Title = "Memory leak in cache service", Description = "Redis cache service shows gradually increasing memory usage over 48 hours.", Status = IncidentStatus.New, Priority = IncidentPriority.High, OrganizationId = org.Id, CreatedByUserId = users[2].Id, TeamId = team1.Id, CreatedAt = DateTime.UtcNow.AddMinutes(-30) }
        };
        _context.Incidents.AddRange(incidents);

        await _context.SaveChangesAsync();
    }
}
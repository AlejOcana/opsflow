using Microsoft.EntityFrameworkCore;
using OpsFlow.Api.Models;

namespace OpsFlow.Api.Data;

public static class DataSeeder
{
    private static readonly string[] IncidentTitles = new[]
    {
        "Database connection timeout",
        "API rate limiting not working",
        "Memory leak in cache service",
        "Deploy CI/CD pipeline improvements",
        "Update monitoring dashboards",
        "Fix authentication token refresh",
        "Optimize database queries",
        "Add logging to payment service",
        "Update Kubernetes cluster",
        "Fix email notification delivery"
    };

    private static readonly string[] IncidentDescriptions = new[]
    {
        "Users experiencing timeouts when connecting to the database",
        "Rate limiting middleware not properly limiting requests",
        "Memory usage increasing over time in cache service",
        "Improve CI/CD pipeline reliability and speed",
        "Add new metrics to monitoring dashboards",
        "Token refresh mechanism not working correctly",
        "Slow database queries affecting performance",
        "Missing email delivery logs for troubleshooting",
        "Upgrade Kubernetes to latest stable version",
        "Email notifications not being sent to users"
    };

    public static async Task SeedAsync(OpsFlowDbContext context)
    {
        if (await context.Organizations.AnyAsync())
            return;

        var org = new Organization
        {
            Name = "TechCorp",
            Description = "Technology Corporation",
            ContactEmail = "admin@opsflow.io",
            CreatedAt = DateTime.UtcNow
        };
        context.Organizations.Add(org);
        await context.SaveChangesAsync();

        var admin = new User
        {
            Username = "admin",
            Email = "admin@opsflow.io",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            FullName = "Alice Admin",
            Role = UserRole.Admin,
            OrganizationId = org.Id,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(admin);

        var platformManager = new User
        {
            Username = "platformmgr",
            Email = "platformmgr@opsflow.io",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Manager123!"),
            FullName = "Bob Platform",
            Role = UserRole.Manager,
            OrganizationId = org.Id,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(platformManager);

        var infraManager = new User
        {
            Username = " inframgr",
            Email = "inframgr@opsflow.io",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Manager123!"),
            FullName = "Carol Infra",
            Role = UserRole.Manager,
            OrganizationId = org.Id,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(infraManager);

        var securityManager = new User
        {
            Username = "securitymgr",
            Email = "securitymgr@opsflow.io",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Manager123!"),
            FullName = "Dave Security",
            Role = UserRole.Manager,
            OrganizationId = org.Id,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(securityManager);

        var dev1 = new User
        {
            Username = "dev1",
            Email = "dev1@opsflow.io",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Developer123!"),
            FullName = "Charlie Developer",
            Role = UserRole.Operator,
            OrganizationId = org.Id,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(dev1);

        var dev2 = new User
        {
            Username = "dev2",
            Email = "dev2@opsflow.io",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Developer123!"),
            FullName = "Diana DevOps",
            Role = UserRole.Operator,
            OrganizationId = org.Id,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(dev2);

        var dev3 = new User
        {
            Username = "dev3",
            Email = "dev3@opsflow.io",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Developer123!"),
            FullName = "Eve Engineer",
            Role = UserRole.Operator,
            OrganizationId = org.Id,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(dev3);

        var dev4 = new User
        {
            Username = "dev4",
            Email = "dev4@opsflow.io",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Developer123!"),
            FullName = "Frank Fullstack",
            Role = UserRole.Operator,
            OrganizationId = org.Id,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(dev4);

        var dev5 = new User
        {
            Username = "dev5",
            Email = "dev5@opsflow.io",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Developer123!"),
            FullName = "Grace Security",
            Role = UserRole.Operator,
            OrganizationId = org.Id,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(dev5);

        await context.SaveChangesAsync();

        var platformTeam = new Team
        {
            Name = "Platform Team",
            Description = "Platform engineering and infrastructure",
            OrganizationId = org.Id,
            ManagerId = platformManager.Id,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        context.Teams.Add(platformTeam);

        var infraTeam = new Team
        {
            Name = "Infrastructure Team",
            Description = "Cloud and network operations",
            OrganizationId = org.Id,
            ManagerId = infraManager.Id,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        context.Teams.Add(infraTeam);

        var securityTeam = new Team
        {
            Name = "Security Team",
            Description = "Security operations and compliance",
            OrganizationId = org.Id,
            ManagerId = securityManager.Id,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        context.Teams.Add(securityTeam);
        await context.SaveChangesAsync();

        dev1.TeamId = platformTeam.Id;
        dev2.TeamId = platformTeam.Id;
        dev3.TeamId = infraTeam.Id;
        dev4.TeamId = infraTeam.Id;
        dev5.TeamId = securityTeam.Id;
        await context.SaveChangesAsync();

        var statuses = new[] { IncidentStatus.Open, IncidentStatus.InProgress, IncidentStatus.Resolved, IncidentStatus.Closed };
        var priorities = new[] { IncidentPriority.Low, IncidentPriority.Medium, IncidentPriority.High, IncidentPriority.Critical };
        var teams = new[] { platformTeam, infraTeam, securityTeam };
        var allDevs = new[] { dev1, dev2, dev3, dev4, dev5 };
        var allUsers = new[] { admin, platformManager, infraManager, securityManager, dev1, dev2, dev3, dev4, dev5 };

        var random = new Random(42);
        for (int i = 0; i < 10; i++)
        {
            var incident = new Incident
            {
                Title = IncidentTitles[i],
                Description = IncidentDescriptions[i],
                Status = statuses[random.Next(statuses.Length)],
                Priority = priorities[random.Next(priorities.Length)],
                OrganizationId = org.Id,
                ReporterId = allUsers[random.Next(allUsers.Length)].Id,
                AssigneeId = i % 3 == 0 ? null : allDevs[random.Next(allDevs.Length)].Id,
                TeamId = teams[random.Next(teams.Length)].Id,
                CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 30))
            };
            context.Incidents.Add(incident);
        }

        await context.SaveChangesAsync();
    }
}
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
        {
            // Incremental seed for Phase 2 tables if core data already exists
            await SeedPhase2IfNeededAsync(context);
            return;
        }

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
            Username = "inframgr",
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
        var incidents = new List<Incident>();
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
            // Set ResolvedAt for resolved/closed to enable lead time KPI
            if (incident.Status == IncidentStatus.Resolved || incident.Status == IncidentStatus.Closed)
                incident.ResolvedAt = incident.CreatedAt.AddDays(random.Next(1, 5)).AddHours(random.Next(1, 12));
            if (incident.Status == IncidentStatus.Closed)
                incident.ClosedAt = (incident.ResolvedAt ?? incident.CreatedAt).AddDays(random.Next(0, 2));
            context.Incidents.Add(incident);
            incidents.Add(incident);
        }

        await context.SaveChangesAsync();

        // Seed comments, audit logs, attachments, notifications for Phase 2
        var commentSamples = new[]
        {
            "Investigating the issue, will update soon.",
            "Root cause identified, preparing fix.",
            "Fix deployed to staging, monitoring.",
            "Confirmed resolved, closing incident.",
            "Need more logs from affected service."
        };

        foreach (var inc in incidents)
        {
            // 1-2 comments per incident
            var commentCount = random.Next(1, 3);
            for (int c = 0; c < commentCount; c++)
            {
                var author = allUsers[random.Next(allUsers.Length)];
                context.Comments.Add(new Comment
                {
                    IncidentId = inc.Id,
                    AuthorId = author.Id,
                    Content = commentSamples[random.Next(commentSamples.Length)],
                    CreatedAt = inc.CreatedAt.AddHours(random.Next(1, 48))
                });
            }

            // 1-2 audit logs per incident
            var auditCount = random.Next(1, 3);
            for (int a = 0; a < auditCount; a++)
            {
                var actor = allUsers[random.Next(allUsers.Length)];
                var actions = new[] { "Created", "StatusChanged", "Assigned" };
                var act = actions[random.Next(actions.Length)];
                context.AuditLogs.Add(new AuditLog
                {
                    Action = act,
                    EntityType = "Incident",
                    EntityId = inc.Id,
                    OldValue = act == "StatusChanged" ? IncidentStatus.Open.ToString() : null,
                    NewValue = act == "StatusChanged" ? inc.Status.ToString() : inc.Title,
                    UserId = actor.Id,
                    CreatedAt = inc.CreatedAt.AddHours(random.Next(2, 72))
                });
            }
        }
        await context.SaveChangesAsync();

        // Seed 2-3 attachments for incidents 1-3 (first 3 incidents)
        var attachmentSamples = new[]
        {
            ("screenshot.png", "image/png", "https://example.com/screenshots/incident-{0}.png"),
            ("error.log", "text/plain", "https://example.com/logs/incident-{0}.log"),
            ("trace.json", "application/json", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==")
        };
        for (int idx = 0; idx < Math.Min(3, incidents.Count); idx++)
        {
            var inc = incidents[idx];
            var attCount = random.Next(2, 4);
            for (int a = 0; a < attCount; a++)
            {
                var sample = attachmentSamples[random.Next(attachmentSamples.Length)];
                var uploader = allUsers[random.Next(allUsers.Length)];
                context.IncidentAttachments.Add(new IncidentAttachment
                {
                    IncidentId = inc.Id,
                    FileName = sample.Item1,
                    ContentType = sample.Item2,
                    Url = string.Format(sample.Item3, inc.Id),
                    UploadedById = uploader.Id,
                    UploadedAt = inc.CreatedAt.AddHours(random.Next(3, 80)),
                    SizeBytes = random.Next(1024, 50000)
                });
            }
        }
        await context.SaveChangesAsync();

        // Seed 2 notifications per user
        var notificationTypes = new[] { NotificationType.Assigned, NotificationType.StatusChanged, NotificationType.Comment, NotificationType.Mention };
        foreach (var user in allUsers)
        {
            for (int n = 0; n < 2; n++)
            {
                var inc = incidents[random.Next(incidents.Count)];
                var type = notificationTypes[random.Next(notificationTypes.Length)];
                var title = type switch
                {
                    NotificationType.Assigned => "Incident assigned to you",
                    NotificationType.StatusChanged => "Incident status changed",
                    NotificationType.Comment => "New comment on incident",
                    _ => "You were mentioned"
                };
                context.Notifications.Add(new Notification
                {
                    UserId = user.Id,
                    IncidentId = inc.Id,
                    Type = type,
                    Title = title,
                    Message = $"{title} #{inc.Id}: {inc.Title}",
                    IsRead = random.Next(0, 2) == 0,
                    CreatedAt = DateTime.UtcNow.AddHours(-random.Next(1, 72))
                });
            }
        }
        await context.SaveChangesAsync();
    }

    private static async Task SeedPhase2IfNeededAsync(OpsFlowDbContext context)
    {
        // If phase2 tables already have data, skip
        if (await context.Comments.AnyAsync() && await context.AuditLogs.AnyAsync() && await context.IncidentAttachments.AnyAsync() && await context.Notifications.AnyAsync())
            return;

        var random = new Random(42);
        var users = await context.Users.ToListAsync();
        var incidents = await context.Incidents.ToListAsync();
        if (!users.Any() || !incidents.Any()) return;

        if (!await context.Comments.AnyAsync())
        {
            var commentSamples = new[] { "Investigating the issue, will update soon.", "Root cause identified, preparing fix.", "Fix deployed to staging, monitoring.", "Confirmed resolved, closing incident.", "Need more logs from affected service." };
            foreach (var inc in incidents)
            {
                var cnt = random.Next(1, 3);
                for (int c = 0; c < cnt; c++)
                {
                    var author = users[random.Next(users.Count)];
                    context.Comments.Add(new Comment { IncidentId = inc.Id, AuthorId = author.Id, Content = commentSamples[random.Next(commentSamples.Length)], CreatedAt = inc.CreatedAt.AddHours(random.Next(1, 48)) });
                }
            }
            await context.SaveChangesAsync();
        }

        if (!await context.AuditLogs.AnyAsync())
        {
            foreach (var inc in incidents)
            {
                var cnt = random.Next(1, 3);
                for (int a = 0; a < cnt; a++)
                {
                    var actor = users[random.Next(users.Count)];
                    var actions = new[] { "Created", "StatusChanged", "Assigned" };
                    var act = actions[random.Next(actions.Length)];
                    context.AuditLogs.Add(new AuditLog { Action = act, EntityType = "Incident", EntityId = inc.Id, OldValue = act == "StatusChanged" ? IncidentStatus.Open.ToString() : null, NewValue = act == "StatusChanged" ? inc.Status.ToString() : inc.Title, UserId = actor.Id, CreatedAt = inc.CreatedAt.AddHours(random.Next(2, 72)) });
                }
            }
            await context.SaveChangesAsync();
        }

        if (!await context.IncidentAttachments.AnyAsync())
        {
            var attachmentSamples = new[] { ("screenshot.png", "image/png", "https://example.com/screenshots/incident-{0}.png"), ("error.log", "text/plain", "https://example.com/logs/incident-{0}.log"), ("trace.json", "application/json", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==") };
            for (int idx = 0; idx < Math.Min(3, incidents.Count); idx++)
            {
                var inc = incidents[idx];
                var attCount = random.Next(2, 4);
                for (int a = 0; a < attCount; a++)
                {
                    var sample = attachmentSamples[random.Next(attachmentSamples.Length)];
                    var uploader = users[random.Next(users.Count)];
                    context.IncidentAttachments.Add(new IncidentAttachment { IncidentId = inc.Id, FileName = sample.Item1, ContentType = sample.Item2, Url = string.Format(sample.Item3, inc.Id), UploadedById = uploader.Id, UploadedAt = inc.CreatedAt.AddHours(random.Next(3, 80)), SizeBytes = random.Next(1024, 50000) });
                }
            }
            await context.SaveChangesAsync();
        }

        if (!await context.Notifications.AnyAsync())
        {
            var notificationTypes = new[] { NotificationType.Assigned, NotificationType.StatusChanged, NotificationType.Comment, NotificationType.Mention };
            foreach (var user in users)
            {
                for (int n = 0; n < 2; n++)
                {
                    var inc = incidents[random.Next(incidents.Count)];
                    var type = notificationTypes[random.Next(notificationTypes.Length)];
                    var title = type switch { NotificationType.Assigned => "Incident assigned to you", NotificationType.StatusChanged => "Incident status changed", NotificationType.Comment => "New comment on incident", _ => "You were mentioned" };
                    context.Notifications.Add(new Notification { UserId = user.Id, IncidentId = inc.Id, Type = type, Title = title, Message = $"{title} #{inc.Id}: {inc.Title}", IsRead = random.Next(0, 2) == 0, CreatedAt = DateTime.UtcNow.AddHours(-random.Next(1, 72)) });
                }
            }
            await context.SaveChangesAsync();
        }
    }
}
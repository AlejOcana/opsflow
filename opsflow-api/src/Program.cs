using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using OpsFlow.Api.Data;
using OpsFlow.Api.DTOs;
using OpsFlow.Api.Middleware;
using OpsFlow.Api.Services;
using OpsFlow.Api.Validators;

var builder = WebApplication.CreateBuilder(args);

// Render: honor PORT env var (Render injects PORT=10000). Falls back to ASPNETCORE_URLS / 5000 locally.
var portEnv = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(portEnv) && int.TryParse(portEnv, out var renderPort))
{
    builder.WebHost.UseUrls($"http://+:{renderPort}");
}

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "OpsFlow API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// Configure DbContext
builder.Services.AddDbContext<OpsFlowDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];
if (string.IsNullOrEmpty(jwtKey)) throw new InvalidOperationException("Jwt:Key missing");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!))
        };
    });

builder.Services.AddAuthorization(options =>
{
    // Role strings map to UserRole enum: Admin, Manager, Operator (Contributor), User (Viewer)
    options.AddPolicy("CanAssign", policy => policy.RequireRole("Admin", "Manager"));
    options.AddPolicy("CanDelete", policy => policy.RequireRole("Admin", "Manager"));
    options.AddPolicy("CanDeleteAttachment", policy => policy.RequireRole("Admin", "Manager"));
    options.AddPolicy("CanCreate", policy => policy.RequireRole("Admin", "Manager", "Operator"));
    options.AddPolicy("ContributorPlus", policy => policy.RequireRole("Admin", "Manager", "Operator"));
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});

// Register repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IOrganizationRepository, OrganizationRepository>();
builder.Services.AddScoped<ITeamRepository, TeamRepository>();
builder.Services.AddScoped<IIncidentRepository, IncidentRepository>();
builder.Services.AddScoped<ICommentRepository, CommentRepository>();
builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
builder.Services.AddScoped<IIncidentAttachmentRepository, IncidentAttachmentRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();

// Register services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IIncidentService, IncidentService>();
builder.Services.AddScoped<ITeamService, TeamService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IAttachmentService, AttachmentService>();
builder.Services.AddScoped<ITimelineService, TimelineService>();

// FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CreateAttachmentRequestValidator>();

// Configure CORS
// AllowAll is permissive for local dev / demo; in production restrict via env var CORS__AllowedOrigins (or CORS_ALLOWED_ORIGINS)
// Example: CORS__AllowedOrigins=https://opsflow.example.com,https://admin.opsflow.example.com
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });

    // Optionally register a restrictive policy if env var is set — keep AllowAll for backwards compat
    var corsOrigins = builder.Configuration["CORS:AllowedOrigins"]
        ?? Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS")
        ?? Environment.GetEnvironmentVariable("CORS__AllowedOrigins");
    if (!string.IsNullOrWhiteSpace(corsOrigins))
    {
        var origins = corsOrigins.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
                                 .Select(o => o.Trim())
                                 .ToArray();
        if (origins.Length > 0)
        {
            options.AddPolicy("Restricted", policy =>
            {
                policy.WithOrigins(origins)
                      .AllowAnyMethod()
                      .AllowAnyHeader()
                      .AllowCredentials();
            });
        }
    }
});

var app = builder.Build();

// Configure the HTTP request pipeline
// Enable Swagger in Development and Production for Render demo (previously IsDevelopment only)
if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

var corsOriginsForUse = app.Configuration["CORS:AllowedOrigins"]
    ?? Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS")
    ?? Environment.GetEnvironmentVariable("CORS__AllowedOrigins");
app.UseCors(!string.IsNullOrWhiteSpace(corsOriginsForUse) ? "Restricted" : "AllowAll");

// Use custom exception middleware
app.UseExceptionMiddleware();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

app.MapControllers();

// Initialize database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<OpsFlowDbContext>();
    db.Database.EnsureCreated();
    // Phase 2: EnsureCreated does NOT create new tables on an existing Neon DB (DB already exists).
    // Keep EnsureCreated approach (no migrations) — use raw SQL CREATE TABLE IF NOT EXISTS for additive tables.
    await EnsurePhase2TablesAsync(db);
    await DataSeeder.SeedAsync(db);
}

static async Task EnsurePhase2TablesAsync(OpsFlowDbContext db)
{
    try
    {
        // IncidentAttachments — matches DbContext Fluent config (FileName 255, ContentType 100, Url 100000, etc.)
        // Use IF NOT EXISTS so fresh DB (EnsureCreated) and existing Neon DB both work; destructive reset alternative: drop tables then EnsureCreated.
        await db.Database.ExecuteSqlRawAsync(@"
CREATE TABLE IF NOT EXISTS ""IncidentAttachments"" (
    ""Id"" SERIAL PRIMARY KEY,
    ""IncidentId"" integer NOT NULL,
    ""FileName"" character varying(255) NOT NULL,
    ""ContentType"" character varying(100) NOT NULL,
    ""Url"" character varying(100000) NOT NULL,
    ""UploadedById"" integer NOT NULL,
    ""UploadedAt"" timestamp with time zone NOT NULL,
    ""SizeBytes"" bigint NOT NULL
);");
        await db.Database.ExecuteSqlRawAsync(@"CREATE INDEX IF NOT EXISTS ""IX_IncidentAttachments_IncidentId"" ON ""IncidentAttachments"" (""IncidentId"");");
        await db.Database.ExecuteSqlRawAsync(@"CREATE INDEX IF NOT EXISTS ""IX_IncidentAttachments_UploadedAt"" ON ""IncidentAttachments"" (""UploadedAt"");");
        // If table pre-existed with HasMaxLength(2048), widen column — safe if already 100000
        try { await db.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""IncidentAttachments"" ALTER COLUMN ""Url"" TYPE character varying(100000);"); } catch { /* ignore if already correct or no table */ }

        await db.Database.ExecuteSqlRawAsync(@"
CREATE TABLE IF NOT EXISTS ""Notifications"" (
    ""Id"" SERIAL PRIMARY KEY,
    ""UserId"" integer NOT NULL,
    ""IncidentId"" integer,
    ""Type"" integer NOT NULL,
    ""Title"" character varying(255) NOT NULL,
    ""Message"" character varying(1000) NOT NULL,
    ""IsRead"" boolean NOT NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL
);");
        await db.Database.ExecuteSqlRawAsync(@"CREATE INDEX IF NOT EXISTS ""IX_Notifications_UserId"" ON ""Notifications"" (""UserId"");");
        await db.Database.ExecuteSqlRawAsync(@"CREATE INDEX IF NOT EXISTS ""IX_Notifications_IsRead"" ON ""Notifications"" (""IsRead"");");
        await db.Database.ExecuteSqlRawAsync(@"CREATE INDEX IF NOT EXISTS ""IX_Notifications_CreatedAt"" ON ""Notifications"" (""CreatedAt"");");

        // Best-effort FKs — add only if not exists (ignore duplicate_object)
        try { await db.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""IncidentAttachments"" ADD CONSTRAINT ""FK_IncidentAttachments_Incidents_IncidentId"" FOREIGN KEY (""IncidentId"") REFERENCES ""Incidents"" (""Id"") ON DELETE CASCADE;"); } catch { }
        try { await db.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""IncidentAttachments"" ADD CONSTRAINT ""FK_IncidentAttachments_Users_UploadedById"" FOREIGN KEY (""UploadedById"") REFERENCES ""Users"" (""Id"") ON DELETE RESTRICT;"); } catch { }
        try { await db.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""Notifications"" ADD CONSTRAINT ""FK_Notifications_Users_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE;"); } catch { }
        try { await db.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""Notifications"" ADD CONSTRAINT ""FK_Notifications_Incidents_IncidentId"" FOREIGN KEY (""IncidentId"") REFERENCES ""Incidents"" (""Id"") ON DELETE SET NULL;"); } catch { }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"EnsurePhase2Tables failed (non-fatal): {ex.Message}");
    }
}

app.Run();

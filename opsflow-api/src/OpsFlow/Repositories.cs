using Microsoft.EntityFrameworkCore;
using OpsFlow.Domain.Entities;
using OpsFlow.Domain.Enums;
using OpsFlow.Domain.Interfaces;
using OpsFlow.Infrastructure.Data;

namespace OpsFlow.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly OpsFlowDbContext _context;
    public UserRepository(OpsFlowDbContext context) { _context = context; }
    public async Task<User?> GetByIdAsync(Guid id) => await _context.Users.FindAsync(id);
    public async Task<IEnumerable<User>> GetAllAsync() => await _context.Users.ToListAsync();
    public async Task<User> AddAsync(User entity) { _context.Users.Add(entity); await _context.SaveChangesAsync(); return entity; }
    public async Task UpdateAsync(User entity) { _context.Users.Update(entity); await _context.SaveChangesAsync(); }
    public async Task DeleteAsync(Guid id) { var e = await GetByIdAsync(id); if (e != null) { _context.Users.Remove(e); await _context.SaveChangesAsync(); } }
    public async Task<bool> ExistsAsync(Guid id) => await _context.Users.AnyAsync(u => u.Id == id);
    public async Task<User?> GetByEmailAsync(string email) => await _context.Users.Include(u => u.Organization).FirstOrDefaultAsync(u => u.Email == email);
    public async Task<IEnumerable<User>> GetByOrganizationAsync(Guid organizationId) => await _context.Users.Where(u => u.OrganizationId == organizationId).ToListAsync();
    public async Task<IEnumerable<User>> GetByTeamAsync(Guid teamId) => await _context.Users.Where(u => u.TeamId == teamId).ToListAsync();
}

public class IncidentRepository : IIncidentRepository
{
    private readonly OpsFlowDbContext _context;
    public IncidentRepository(OpsFlowDbContext context) { _context = context; }
    public async Task<Incident?> GetByIdAsync(Guid id) => await _context.Incidents.Include(i => i.CreatedByUser).Include(i => i.AssignedToUser).Include(i => i.Team).FirstOrDefaultAsync(i => i.Id == id);
    public async Task<IEnumerable<Incident>> GetAllAsync() => await _context.Incidents.ToListAsync();
    public async Task<Incident> AddAsync(Incident entity) { _context.Incidents.Add(entity); await _context.SaveChangesAsync(); return entity; }
    public async Task UpdateAsync(Incident entity) { _context.Incidents.Update(entity); await _context.SaveChangesAsync(); }
    public async Task DeleteAsync(Guid id) { var e = await GetByIdAsync(id); if (e != null) { _context.Incidents.Remove(e); await _context.SaveChangesAsync(); } }
    public async Task<bool> ExistsAsync(Guid id) => await _context.Incidents.AnyAsync(i => i.Id == id);
    public async Task<IEnumerable<Incident>> GetByOrganizationAsync(Guid organizationId) => await _context.Incidents.Where(i => i.OrganizationId == organizationId).Include(i => i.CreatedByUser).Include(i => i.AssignedToUser).Include(i => i.Team).OrderByDescending(i => i.CreatedAt).ToListAsync();
    public async Task<IEnumerable<Incident>> GetByUserAsync(Guid userId) => await _context.Incidents.Where(i => i.CreatedByUserId == userId || i.AssignedToUserId == userId).OrderByDescending(i => i.CreatedAt).ToListAsync();
    public async Task<IEnumerable<Incident>> GetByStatusAsync(Guid organizationId, IncidentStatus status) => await _context.Incidents.Where(i => i.OrganizationId == organizationId && i.Status == status).OrderByDescending(i => i.CreatedAt).ToListAsync();
    public async Task<IEnumerable<Incident>> SearchAsync(Guid organizationId, string searchTerm) => await _context.Incidents.Where(i => i.OrganizationId == organizationId && (i.Title.Contains(searchTerm) || i.Description.Contains(searchTerm))).OrderByDescending(i => i.CreatedAt).ToListAsync();
}

public class TeamRepository : ITeamRepository
{
    private readonly OpsFlowDbContext _context;
    public TeamRepository(OpsFlowDbContext context) { _context = context; }
    public async Task<Team?> GetByIdAsync(Guid id) => await _context.Teams.Include(t => t.Members).FirstOrDefaultAsync(t => t.Id == id);
    public async Task<IEnumerable<Team>> GetAllAsync() => await _context.Teams.ToListAsync();
    public async Task<Team> AddAsync(Team entity) { _context.Teams.Add(entity); await _context.SaveChangesAsync(); return entity; }
    public async Task UpdateAsync(Team entity) { _context.Teams.Update(entity); await _context.SaveChangesAsync(); }
    public async Task DeleteAsync(Guid id) { var e = await GetByIdAsync(id); if (e != null) { _context.Teams.Remove(e); await _context.SaveChangesAsync(); } }
    public async Task<bool> ExistsAsync(Guid id) => await _context.Teams.AnyAsync(t => t.Id == id);
    public async Task<IEnumerable<Team>> GetByOrganizationAsync(Guid organizationId) => await _context.Teams.Where(t => t.OrganizationId == organizationId).Include(t => t.Members).ToListAsync();
}

public class OrganizationRepository : IOrganizationRepository
{
    private readonly OpsFlowDbContext _context;
    public OrganizationRepository(OpsFlowDbContext context) { _context = context; }
    public async Task<Organization?> GetByIdAsync(Guid id) => await _context.Organizations.FindAsync(id);
    public async Task<IEnumerable<Organization>> GetAllAsync() => await _context.Organizations.ToListAsync();
    public async Task<Organization> AddAsync(Organization entity) { _context.Organizations.Add(entity); await _context.SaveChangesAsync(); return entity; }
    public async Task UpdateAsync(Organization entity) { _context.Organizations.Update(entity); await _context.SaveChangesAsync(); }
    public async Task DeleteAsync(Guid id) { var e = await GetByIdAsync(id); if (e != null) { _context.Organizations.Remove(e); await _context.SaveChangesAsync(); } }
    public async Task<bool> ExistsAsync(Guid id) => await _context.Organizations.AnyAsync(o => o.Id == id);
    public async Task<Organization?> GetBySlugAsync(string slug) => await _context.Organizations.FirstOrDefaultAsync(o => o.Slug == slug);
}

public class CommentRepository : ICommentRepository
{
    private readonly OpsFlowDbContext _context;
    public CommentRepository(OpsFlowDbContext context) { _context = context; }
    public async Task<Comment?> GetByIdAsync(Guid id) => await _context.Comments.Include(c => c.User).FirstOrDefaultAsync(c => c.Id == id);
    public async Task<IEnumerable<Comment>> GetAllAsync() => await _context.Comments.ToListAsync();
    public async Task<Comment> AddAsync(Comment entity) { _context.Comments.Add(entity); await _context.SaveChangesAsync(); return entity; }
    public async Task UpdateAsync(Comment entity) { _context.Comments.Update(entity); await _context.SaveChangesAsync(); }
    public async Task DeleteAsync(Guid id) { var e = await GetByIdAsync(id); if (e != null) { _context.Comments.Remove(e); await _context.SaveChangesAsync(); } }
    public async Task<bool> ExistsAsync(Guid id) => await _context.Comments.AnyAsync(c => c.Id == id);
    public async Task<IEnumerable<Comment>> GetByIncidentAsync(Guid incidentId) => await _context.Comments.Where(c => c.IncidentId == incidentId).Include(c => c.User).OrderBy(c => c.CreatedAt).ToListAsync();
}

public class AuditLogRepository : IAuditLogRepository
{
    private readonly OpsFlowDbContext _context;
    public AuditLogRepository(OpsFlowDbContext context) { _context = context; }
    public async Task<AuditLog?> GetByIdAsync(Guid id) => await _context.AuditLogs.Include(a => a.User).FirstOrDefaultAsync(a => a.Id == id);
    public async Task<IEnumerable<AuditLog>> GetAllAsync() => await _context.AuditLogs.OrderByDescending(a => a.CreatedAt).ToListAsync();
    public async Task<AuditLog> AddAsync(AuditLog entity) { _context.AuditLogs.Add(entity); await _context.SaveChangesAsync(); return entity; }
    public async Task UpdateAsync(AuditLog entity) { _context.AuditLogs.Update(entity); await _context.SaveChangesAsync(); }
    public async Task DeleteAsync(Guid id) { var e = await GetByIdAsync(id); if (e != null) { _context.AuditLogs.Remove(e); await _context.SaveChangesAsync(); } }
    public async Task<bool> ExistsAsync(Guid id) => await _context.AuditLogs.AnyAsync(a => a.Id == id);
    public async Task<IEnumerable<AuditLog>> GetByIncidentAsync(Guid incidentId) => await _context.AuditLogs.Where(a => a.IncidentId == incidentId).Include(a => a.User).OrderByDescending(a => a.CreatedAt).ToListAsync();
    public async Task<IEnumerable<AuditLog>> GetByOrganizationAsync(Guid organizationId, int limit = 50) => await _context.AuditLogs.Where(a => a.Incident != null && a.Incident.OrganizationId == organizationId).Include(a => a.User).Include(a => a.Incident).OrderByDescending(a => a.CreatedAt).Take(limit).ToListAsync();
}
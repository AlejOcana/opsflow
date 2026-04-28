using Microsoft.EntityFrameworkCore;
using OpsFlow.Api.Models;
using OpsFlow.Api.DTOs;

namespace OpsFlow.Api.Data;

public class UserRepository : IUserRepository
{
    private readonly OpsFlowDbContext _context;

    public UserRepository(OpsFlowDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(int id)
        => await _context.Users.FindAsync(id);

    public async Task<User?> GetByUsernameAsync(string username)
        => await _context.Users.FirstOrDefaultAsync(u => u.Username == username);

    public async Task<User?> GetByEmailAsync(string email)
        => await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

    public async Task<IEnumerable<User>> GetAllAsync()
        => await _context.Users.ToListAsync();

    public async Task<IEnumerable<User>> GetByOrganizationAsync(int organizationId)
        => await _context.Users.Where(u => u.OrganizationId == organizationId).ToListAsync();

    public async Task<IEnumerable<User>> GetByTeamAsync(int teamId)
        => await _context.Users.Where(u => u.TeamId == teamId).ToListAsync();

    public async Task<User> AddAsync(User user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<User> UpdateAsync(User user)
    {
        user.UpdatedAt = DateTime.UtcNow;
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return false;
        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
        => await _context.Users.AnyAsync(u => u.Id == id);

    public async Task<bool> ExistsByUsernameAsync(string username)
        => await _context.Users.AnyAsync(u => u.Username == username);

    public async Task<bool> ExistsByEmailAsync(string email)
        => await _context.Users.AnyAsync(u => u.Email == email);
}

public class OrganizationRepository : IOrganizationRepository
{
    private readonly OpsFlowDbContext _context;

    public OrganizationRepository(OpsFlowDbContext context)
    {
        _context = context;
    }

    public async Task<Organization?> GetByIdAsync(int id)
        => await _context.Organizations.FindAsync(id);

    public async Task<Organization?> GetByIdWithDetailsAsync(int id)
        => await _context.Organizations
            .Include(o => o.Users)
            .Include(o => o.Teams)
            .Include(o => o.Incidents)
            .FirstOrDefaultAsync(o => o.Id == id);

    public async Task<IEnumerable<Organization>> GetAllAsync()
        => await _context.Organizations.ToListAsync();

    public async Task<Organization> AddAsync(Organization organization)
    {
        _context.Organizations.Add(organization);
        await _context.SaveChangesAsync();
        return organization;
    }

    public async Task<Organization> UpdateAsync(Organization organization)
    {
        organization.UpdatedAt = DateTime.UtcNow;
        _context.Organizations.Update(organization);
        await _context.SaveChangesAsync();
        return organization;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var organization = await _context.Organizations.FindAsync(id);
        if (organization == null) return false;
        _context.Organizations.Remove(organization);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
        => await _context.Organizations.AnyAsync(o => o.Id == id);

    public async Task<bool> ExistsByNameAsync(string name)
        => await _context.Organizations.AnyAsync(o => o.Name == name);
}

public class TeamRepository : ITeamRepository
{
    private readonly OpsFlowDbContext _context;

    public TeamRepository(OpsFlowDbContext context)
    {
        _context = context;
    }

    public async Task<Team?> GetByIdAsync(int id)
        => await _context.Teams.FindAsync(id);

    public async Task<Team?> GetByIdWithDetailsAsync(int id)
        => await _context.Teams
            .Include(t => t.Members)
            .Include(t => t.Incidents)
            .Include(t => t.Manager)
            .FirstOrDefaultAsync(t => t.Id == id);

    public async Task<IEnumerable<Team>> GetAllAsync()
        => await _context.Teams
            .Include(t => t.Members)
            .Include(t => t.Incidents)
            .Include(t => t.Manager)
            .ToListAsync();

    public async Task<IEnumerable<Team>> GetByOrganizationAsync(int organizationId)
        => await _context.Teams
            .Where(t => t.OrganizationId == organizationId)
            .Include(t => t.Members)
            .Include(t => t.Incidents)
            .Include(t => t.Manager)
            .ToListAsync();

    public async Task<Team> AddAsync(Team team)
    {
        _context.Teams.Add(team);
        await _context.SaveChangesAsync();
        return team;
    }

    public async Task<Team> UpdateAsync(Team team)
    {
        team.UpdatedAt = DateTime.UtcNow;
        _context.Teams.Update(team);
        await _context.SaveChangesAsync();
        return team;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var team = await _context.Teams.FindAsync(id);
        if (team == null) return false;
        _context.Teams.Remove(team);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
        => await _context.Teams.AnyAsync(t => t.Id == id);
}

public class IncidentRepository : IIncidentRepository
{
    private readonly OpsFlowDbContext _context;

    public IncidentRepository(OpsFlowDbContext context)
    {
        _context = context;
    }

    public async Task<Incident?> GetByIdAsync(int id)
        => await _context.Incidents.FindAsync(id);

    public async Task<Incident?> GetByIdWithDetailsAsync(int id)
        => await _context.Incidents
            .Include(i => i.Organization)
            .Include(i => i.Team)
            .Include(i => i.Reporter)
            .Include(i => i.Assignee)
            .Include(i => i.Comments)
            .FirstOrDefaultAsync(i => i.Id == id);

    public async Task<IEnumerable<Incident>> GetAllAsync()
        => await _context.Incidents.ToListAsync();

    public async Task<IEnumerable<Incident>> GetByOrganizationAsync(int organizationId, int page, int pageSize)
        => await _context.Incidents
            .Where(i => i.OrganizationId == organizationId)
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

    public IQueryable<Incident> GetByOrganizationQueryable(int organizationId)
        => _context.Incidents
            .Where(i => i.OrganizationId == organizationId)
            .Include(i => i.Reporter)
            .Include(i => i.Assignee)
            .Include(i => i.Team)
            .Include(i => i.Comments);

    public async Task<IEnumerable<Incident>> GetByTeamAsync(int teamId, int page, int pageSize)
        => await _context.Incidents
            .Where(i => i.TeamId == teamId)
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

    public async Task<IEnumerable<Incident>> GetByStatusAsync(int organizationId, IncidentStatus status, int page, int pageSize)
        => await _context.Incidents
            .Where(i => i.OrganizationId == organizationId && i.Status == status)
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

    public async Task<IEnumerable<Incident>> GetByPriorityAsync(int organizationId, IncidentPriority priority, int page, int pageSize)
        => await _context.Incidents
            .Where(i => i.OrganizationId == organizationId && i.Priority == priority)
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

    public async Task<IEnumerable<Incident>> GetByAssigneeAsync(int assigneeId, int page, int pageSize)
        => await _context.Incidents
            .Where(i => i.AssigneeId == assigneeId)
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

    public async Task<IEnumerable<Incident>> GetByReporterAsync(int reporterId, int page, int pageSize)
        => await _context.Incidents
            .Where(i => i.ReporterId == reporterId)
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

    public async Task<Incident> AddAsync(Incident incident)
    {
        _context.Incidents.Add(incident);
        await _context.SaveChangesAsync();
        return incident;
    }

    public async Task<Incident> UpdateAsync(Incident incident)
    {
        incident.UpdatedAt = DateTime.UtcNow;
        _context.Incidents.Update(incident);
        await _context.SaveChangesAsync();
        return incident;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var incident = await _context.Incidents.FindAsync(id);
        if (incident == null) return false;
        _context.Incidents.Remove(incident);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
        => await _context.Incidents.AnyAsync(i => i.Id == id);

    public async Task<int> GetCountByOrganizationAsync(int organizationId)
        => await _context.Incidents.CountAsync(i => i.OrganizationId == organizationId);

    public async Task<int> GetCountByStatusAsync(IncidentStatus status)
        => await _context.Incidents.CountAsync(i => i.Status == status);

    public async Task<int> GetCountByPriorityAsync(IncidentPriority priority)
        => await _context.Incidents.CountAsync(i => i.Priority == priority);

    public async Task<IEnumerable<IncidentTrendDto>> GetTrendAsync(int organizationId, int days)
    {
        var startDate = DateTime.UtcNow.AddDays(-days);
        return await _context.Incidents
            .Where(i => i.OrganizationId == organizationId && i.CreatedAt >= startDate)
            .GroupBy(i => i.CreatedAt.Date)
            .Select(g => new IncidentTrendDto(g.Key, g.Count()))
            .OrderBy(x => x.Date)
            .ToListAsync();
    }
}

public class CommentRepository : ICommentRepository
{
    private readonly OpsFlowDbContext _context;

    public CommentRepository(OpsFlowDbContext context)
    {
        _context = context;
    }

    public async Task<Comment?> GetByIdAsync(int id)
        => await _context.Comments.FindAsync(id);

    public async Task<IEnumerable<Comment>> GetByIncidentAsync(int incidentId)
        => await _context.Comments
            .Where(c => c.IncidentId == incidentId && !c.IsDeleted)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

    public async Task<Comment> AddAsync(Comment comment)
    {
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();
        return comment;
    }

    public async Task<Comment> UpdateAsync(Comment comment)
    {
        comment.UpdatedAt = DateTime.UtcNow;
        _context.Comments.Update(comment);
        await _context.SaveChangesAsync();
        return comment;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var comment = await _context.Comments.FindAsync(id);
        if (comment == null) return false;
        comment.IsDeleted = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
        => await _context.Comments.AnyAsync(c => c.Id == id);
}

public class AuditLogRepository : IAuditLogRepository
{
    private readonly OpsFlowDbContext _context;

    public AuditLogRepository(OpsFlowDbContext context)
    {
        _context = context;
    }

    public async Task<AuditLog?> GetByIdAsync(int id)
        => await _context.AuditLogs.FindAsync(id);

    public async Task<IEnumerable<AuditLog>> GetAllAsync(int page, int pageSize)
        => await _context.AuditLogs
            .Include(a => a.User)
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

    public async Task<IEnumerable<AuditLog>> GetByEntityAsync(string entityType, int entityId)
        => await _context.AuditLogs
            .Where(a => a.EntityType == entityType && a.EntityId == entityId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

    public async Task<AuditLog> AddAsync(AuditLog auditLog)
    {
        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();
        return auditLog;
    }
}
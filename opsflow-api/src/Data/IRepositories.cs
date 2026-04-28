using OpsFlow.Api.Models;
using OpsFlow.Api.DTOs;

namespace OpsFlow.Api.Data;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id);
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByEmailAsync(string email);
    Task<IEnumerable<User>> GetAllAsync();
    Task<IEnumerable<User>> GetByOrganizationAsync(int organizationId);
    Task<IEnumerable<User>> GetByTeamAsync(int teamId);
    Task<User> AddAsync(User user);
    Task<User> UpdateAsync(User user);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
    Task<bool> ExistsByUsernameAsync(string username);
    Task<bool> ExistsByEmailAsync(string email);
}

public interface IOrganizationRepository
{
    Task<Organization?> GetByIdAsync(int id);
    Task<Organization?> GetByIdWithDetailsAsync(int id);
    Task<IEnumerable<Organization>> GetAllAsync();
    Task<Organization> AddAsync(Organization organization);
    Task<Organization> UpdateAsync(Organization organization);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
    Task<bool> ExistsByNameAsync(string name);
}

public interface ITeamRepository
{
    Task<Team?> GetByIdAsync(int id);
    Task<Team?> GetByIdWithDetailsAsync(int id);
    Task<IEnumerable<Team>> GetAllAsync();
    Task<IEnumerable<Team>> GetByOrganizationAsync(int organizationId);
    Task<Team> AddAsync(Team team);
    Task<Team> UpdateAsync(Team team);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
}

public interface IIncidentRepository
{
    Task<Incident?> GetByIdAsync(int id);
    Task<Incident?> GetByIdWithDetailsAsync(int id);
    Task<IEnumerable<Incident>> GetAllAsync();
    Task<IEnumerable<Incident>> GetByOrganizationAsync(int organizationId, int page, int pageSize);
    IQueryable<Incident> GetByOrganizationQueryable(int organizationId);
    Task<IEnumerable<Incident>> GetByTeamAsync(int teamId, int page, int pageSize);
    Task<IEnumerable<Incident>> GetByStatusAsync(int organizationId, IncidentStatus status, int page, int pageSize);
    Task<IEnumerable<Incident>> GetByPriorityAsync(int organizationId, IncidentPriority priority, int page, int pageSize);
    Task<IEnumerable<Incident>> GetByAssigneeAsync(int assigneeId, int page, int pageSize);
    Task<IEnumerable<Incident>> GetByReporterAsync(int reporterId, int page, int pageSize);
    Task<Incident> AddAsync(Incident incident);
    Task<Incident> UpdateAsync(Incident incident);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
    Task<int> GetCountByOrganizationAsync(int organizationId);
    Task<int> GetCountByStatusAsync(IncidentStatus status);
    Task<int> GetCountByPriorityAsync(IncidentPriority priority);
    Task<IEnumerable<IncidentTrendDto>> GetTrendAsync(int organizationId, int days);
}

public interface ICommentRepository
{
    Task<Comment?> GetByIdAsync(int id);
    Task<IEnumerable<Comment>> GetByIncidentAsync(int incidentId);
    Task<Comment> AddAsync(Comment comment);
    Task<Comment> UpdateAsync(Comment comment);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
}

public interface IAuditLogRepository
{
    Task<AuditLog?> GetByIdAsync(int id);
    Task<IEnumerable<AuditLog>> GetAllAsync(int page, int pageSize);
    Task<IEnumerable<AuditLog>> GetByEntityAsync(string entityType, int entityId);
    Task<AuditLog> AddAsync(AuditLog auditLog);
}
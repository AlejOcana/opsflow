using OpsFlow.Domain.Entities;
using OpsFlow.Domain.Enums;

namespace OpsFlow.Domain.Interfaces;

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(Guid id);
    Task<bool> ExistsAsync(Guid id);
}

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
    Task<IEnumerable<User>> GetByOrganizationAsync(Guid organizationId);
    Task<IEnumerable<User>> GetByTeamAsync(Guid teamId);
}

public interface IIncidentRepository : IRepository<Incident>
{
    Task<IEnumerable<Incident>> GetByOrganizationAsync(Guid organizationId);
    Task<IEnumerable<Incident>> GetByUserAsync(Guid userId);
    Task<IEnumerable<Incident>> GetByStatusAsync(Guid organizationId, IncidentStatus status);
    Task<IEnumerable<Incident>> SearchAsync(Guid organizationId, string searchTerm);
}

public interface ITeamRepository : IRepository<Team>
{
    Task<IEnumerable<Team>> GetByOrganizationAsync(Guid organizationId);
}

public interface IOrganizationRepository : IRepository<Organization>
{
    Task<Organization?> GetBySlugAsync(string slug);
}

public interface ICommentRepository : IRepository<Comment>
{
    Task<IEnumerable<Comment>> GetByIncidentAsync(Guid incidentId);
}

public interface IAuditLogRepository : IRepository<AuditLog>
{
    Task<IEnumerable<AuditLog>> GetByIncidentAsync(Guid incidentId);
    Task<IEnumerable<AuditLog>> GetByOrganizationAsync(Guid organizationId, int limit = 50);
}
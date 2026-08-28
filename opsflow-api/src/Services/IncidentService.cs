using Microsoft.EntityFrameworkCore;
using OpsFlow.Api.Data;
using OpsFlow.Api.DTOs;
using OpsFlow.Api.Models;

namespace OpsFlow.Api.Services;

public interface IIncidentService
{
    Task<IncidentDetailDto?> GetByIdAsync(int id);
    Task<IEnumerable<IncidentDto>> GetAllAsync(int organizationId, int page, int pageSize);
    Task<IEnumerable<IncidentListDto>> GetAllForFrontendAsync(int organizationId, string? status, string? search, int page, int pageSize);
    Task<IEnumerable<IncidentDto>> GetByTeamAsync(int teamId, int page, int pageSize);
    Task<IEnumerable<IncidentDto>> GetByStatusAsync(int organizationId, IncidentStatus status, int page, int pageSize);
    Task<IEnumerable<IncidentDto>> GetByPriorityAsync(int organizationId, IncidentPriority priority, int page, int pageSize);
    Task<IEnumerable<IncidentDto>> GetByAssigneeAsync(int assigneeId, int page, int pageSize);
    Task<IncidentDto> CreateAsync(CreateIncidentRequest request, int reporterId);
    Task<IncidentDto?> UpdateAsync(int id, UpdateIncidentRequest request, int userId);
    Task<bool> DeleteAsync(int id);
    Task<int> GetCountAsync(int organizationId);
    // Phase 2
    Task<IncidentDto?> AssignAsync(int incidentId, int assigneeId, int actorUserId);
    Task<IncidentDto?> UpdateStatusAsync(int incidentId, IncidentStatus newStatus, int actorUserId);
    Task<CommentDto> AddCommentAsync(int incidentId, string content, int authorId);
    Task<IEnumerable<CommentDto>> GetCommentsAsync(int incidentId);
}

public class IncidentService : IIncidentService
{
    private readonly IIncidentRepository _incidentRepository;
    private readonly IUserRepository _userRepository;
    private readonly ITeamRepository _teamRepository;
    private readonly IOrganizationRepository _organizationRepository;
    private readonly ICommentRepository _commentRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly INotificationRepository _notificationRepository;

    public IncidentService(
        IIncidentRepository incidentRepository,
        IUserRepository userRepository,
        ITeamRepository teamRepository,
        IOrganizationRepository organizationRepository,
        ICommentRepository commentRepository,
        IAuditLogRepository auditLogRepository,
        INotificationRepository notificationRepository)
    {
        _incidentRepository = incidentRepository;
        _userRepository = userRepository;
        _teamRepository = teamRepository;
        _organizationRepository = organizationRepository;
        _commentRepository = commentRepository;
        _auditLogRepository = auditLogRepository;
        _notificationRepository = notificationRepository;
    }

    public async Task<IncidentDetailDto?> GetByIdAsync(int id)
    {
        var incident = await _incidentRepository.GetByIdWithDetailsAsync(id);
        return incident == null ? null : MapToDetailDto(incident);
    }

    public async Task<IEnumerable<IncidentDto>> GetAllAsync(int organizationId, int page, int pageSize)
    {
        var incidents = await _incidentRepository.GetByOrganizationAsync(organizationId, page, pageSize);
        return incidents.Select(MapToDto);
    }

    public async Task<IEnumerable<IncidentListDto>> GetAllForFrontendAsync(int organizationId, string? status, string? search, int page, int pageSize)
    {
        var query = _incidentRepository.GetByOrganizationQueryable(organizationId);
        
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<IncidentStatus>(status, true, out var statusEnum))
        {
            query = query.Where(i => i.Status == statusEnum);
        }
        
        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(i => i.Title.ToLower().Contains(searchLower) || i.Description.ToLower().Contains(searchLower));
        }
        
        var incidents = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
            
        return incidents.Select(MapToListDto);
    }

    public async Task<IEnumerable<IncidentDto>> GetByTeamAsync(int teamId, int page, int pageSize)
    {
        var incidents = await _incidentRepository.GetByTeamAsync(teamId, page, pageSize);
        return incidents.Select(MapToDto);
    }

    public async Task<IEnumerable<IncidentDto>> GetByStatusAsync(int organizationId, IncidentStatus status, int page, int pageSize)
    {
        var incidents = await _incidentRepository.GetByStatusAsync(organizationId, status, page, pageSize);
        return incidents.Select(MapToDto);
    }

    public async Task<IEnumerable<IncidentDto>> GetByPriorityAsync(int organizationId, IncidentPriority priority, int page, int pageSize)
    {
        var incidents = await _incidentRepository.GetByPriorityAsync(organizationId, priority, page, pageSize);
        return incidents.Select(MapToDto);
    }

    public async Task<IEnumerable<IncidentDto>> GetByAssigneeAsync(int assigneeId, int page, int pageSize)
    {
        var incidents = await _incidentRepository.GetByAssigneeAsync(assigneeId, page, pageSize);
        return incidents.Select(MapToDto);
    }

    public async Task<IncidentDto> CreateAsync(CreateIncidentRequest request, int reporterId)
    {
        var incident = new Incident
        {
            Title = request.Title,
            Description = request.Description,
            Priority = request.Priority,
            Status = IncidentStatus.Open,
            OrganizationId = request.OrganizationId,
            TeamId = request.TeamId,
            ReporterId = reporterId,
            AssigneeId = request.AssigneeId
        };

        var created = await _incidentRepository.AddAsync(incident);

        await _auditLogRepository.AddAsync(new AuditLog
        {
            Action = "Created",
            EntityType = "Incident",
            EntityId = created.Id,
            OldValue = null,
            NewValue = created.Title,
            UserId = reporterId,
            CreatedAt = DateTime.UtcNow
        });

        // Notify assignee if assigned on creation
        if (created.AssigneeId.HasValue && created.AssigneeId.Value != reporterId)
        {
            await _notificationRepository.AddAsync(new Notification
            {
                UserId = created.AssigneeId.Value,
                IncidentId = created.Id,
                Type = NotificationType.Assigned,
                Title = "Incident assigned to you",
                Message = $"You have been assigned to incident #{created.Id}: {created.Title}",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        return MapToDto(created);
    }

    public async Task<IncidentDto?> UpdateAsync(int id, UpdateIncidentRequest request, int userId)
    {
        var incident = await _incidentRepository.GetByIdWithDetailsAsync(id);
        if (incident == null) return null;

        var oldStatus = incident.Status;
        var oldAssignee = incident.AssigneeId;

        if (!string.IsNullOrEmpty(request.Title))
            incident.Title = request.Title;
        if (!string.IsNullOrEmpty(request.Description))
            incident.Description = request.Description;
        if (request.Status.HasValue)
        {
            incident.Status = request.Status.Value;
            if (request.Status == IncidentStatus.Resolved)
                incident.ResolvedAt = DateTime.UtcNow;
            else if (request.Status == IncidentStatus.Closed)
                incident.ClosedAt = DateTime.UtcNow;
        }
        if (request.Priority.HasValue)
            incident.Priority = request.Priority.Value;
        if (request.TeamId.HasValue)
            incident.TeamId = request.TeamId;
        if (request.AssigneeId.HasValue)
            incident.AssigneeId = request.AssigneeId;

        var updated = await _incidentRepository.UpdateAsync(incident);

        // Audit & notifications for status change
        if (request.Status.HasValue && oldStatus != request.Status.Value)
        {
            await _auditLogRepository.AddAsync(new AuditLog
            {
                Action = "StatusChanged",
                EntityType = "Incident",
                EntityId = id,
                OldValue = oldStatus.ToString(),
                NewValue = request.Status.Value.ToString(),
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            });
            // Notify reporter and assignee (if different from actor)
            var notifyTargets = new HashSet<int>();
            if (incident.ReporterId != userId) notifyTargets.Add(incident.ReporterId);
            if (incident.AssigneeId.HasValue && incident.AssigneeId.Value != userId) notifyTargets.Add(incident.AssigneeId.Value);
            foreach (var uid in notifyTargets)
            {
                await _notificationRepository.AddAsync(new Notification
                {
                    UserId = uid,
                    IncidentId = id,
                    Type = NotificationType.StatusChanged,
                    Title = "Incident status changed",
                    Message = $"Incident #{id} status changed from {oldStatus} to {request.Status.Value} by user #{userId}",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }
        if (request.AssigneeId.HasValue && oldAssignee != request.AssigneeId.Value)
        {
            await _auditLogRepository.AddAsync(new AuditLog
            {
                Action = "Assigned",
                EntityType = "Incident",
                EntityId = id,
                OldValue = oldAssignee?.ToString(),
                NewValue = request.AssigneeId.Value.ToString(),
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            });
            if (request.AssigneeId.Value != userId)
            {
                await _notificationRepository.AddAsync(new Notification
                {
                    UserId = request.AssigneeId.Value,
                    IncidentId = id,
                    Type = NotificationType.Assigned,
                    Title = "Incident assigned to you",
                    Message = $"You have been assigned to incident #{id}",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        return MapToDto(updated);
    }

    public async Task<IncidentDto?> AssignAsync(int incidentId, int assigneeId, int actorUserId)
    {
        var incident = await _incidentRepository.GetByIdWithDetailsAsync(incidentId);
        if (incident == null) return null;
        if (!await _userRepository.ExistsAsync(assigneeId)) throw new InvalidOperationException("Assignee not found");

        var oldAssignee = incident.AssigneeId;
        incident.AssigneeId = assigneeId;
        var updated = await _incidentRepository.UpdateAsync(incident);

        await _auditLogRepository.AddAsync(new AuditLog
        {
            Action = "Assigned",
            EntityType = "Incident",
            EntityId = incidentId,
            OldValue = oldAssignee?.ToString(),
            NewValue = assigneeId.ToString(),
            UserId = actorUserId,
            CreatedAt = DateTime.UtcNow
        });

        if (assigneeId != actorUserId)
        {
            await _notificationRepository.AddAsync(new Notification
            {
                UserId = assigneeId,
                IncidentId = incidentId,
                Type = NotificationType.Assigned,
                Title = "Incident assigned to you",
                Message = $"You have been assigned to incident #{incidentId}: {incident.Title}",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        return MapToDto(updated);
    }

    public async Task<IncidentDto?> UpdateStatusAsync(int incidentId, IncidentStatus newStatus, int actorUserId)
    {
        var incident = await _incidentRepository.GetByIdWithDetailsAsync(incidentId);
        if (incident == null) return null;
        var oldStatus = incident.Status;
        if (oldStatus == newStatus) return MapToDto(incident);

        incident.Status = newStatus;
        if (newStatus == IncidentStatus.Resolved) incident.ResolvedAt = DateTime.UtcNow;
        else if (newStatus == IncidentStatus.Closed) incident.ClosedAt = DateTime.UtcNow;

        var updated = await _incidentRepository.UpdateAsync(incident);

        await _auditLogRepository.AddAsync(new AuditLog
        {
            Action = "StatusChanged",
            EntityType = "Incident",
            EntityId = incidentId,
            OldValue = oldStatus.ToString(),
            NewValue = newStatus.ToString(),
            UserId = actorUserId,
            CreatedAt = DateTime.UtcNow
        });

        var notifyTargets = new HashSet<int>();
        if (incident.ReporterId != actorUserId) notifyTargets.Add(incident.ReporterId);
        if (incident.AssigneeId.HasValue && incident.AssigneeId.Value != actorUserId) notifyTargets.Add(incident.AssigneeId.Value);
        foreach (var uid in notifyTargets)
        {
            await _notificationRepository.AddAsync(new Notification
            {
                UserId = uid,
                IncidentId = incidentId,
                Type = NotificationType.StatusChanged,
                Title = "Incident status changed",
                Message = $"Incident #{incidentId} status changed from {oldStatus} to {newStatus}",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        return MapToDto(updated);
    }

    public async Task<CommentDto> AddCommentAsync(int incidentId, string content, int authorId)
    {
        var incident = await _incidentRepository.GetByIdAsync(incidentId) ?? throw new InvalidOperationException("Incident not found");
        var author = await _userRepository.GetByIdAsync(authorId);

        var comment = new Comment
        {
            IncidentId = incidentId,
            Content = content,
            AuthorId = authorId,
            CreatedAt = DateTime.UtcNow
        };
        var created = await _commentRepository.AddAsync(comment);

        await _auditLogRepository.AddAsync(new AuditLog
        {
            Action = "CommentAdded",
            EntityType = "Incident",
            EntityId = incidentId,
            OldValue = null,
            NewValue = content.Length > 100 ? content.Substring(0, 100) : content,
            UserId = authorId,
            CreatedAt = DateTime.UtcNow
        });

        // Notify assignee/reporter if not author
        var notifyTargets = new HashSet<int>();
        if (incident.ReporterId != authorId) notifyTargets.Add(incident.ReporterId);
        if (incident.AssigneeId.HasValue && incident.AssigneeId.Value != authorId) notifyTargets.Add(incident.AssigneeId.Value);
        foreach (var uid in notifyTargets)
        {
            await _notificationRepository.AddAsync(new Notification
            {
                UserId = uid,
                IncidentId = incidentId,
                Type = NotificationType.Comment,
                Title = "New comment on incident",
                Message = $"{author?.FullName ?? $"User#{authorId}"} commented on incident #{incidentId}: {content.Substring(0, Math.Min(80, content.Length))}",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        return new CommentDto(created.Id, created.Content, created.IncidentId, created.AuthorId, author?.FullName ?? author?.Username ?? $"User#{authorId}", created.CreatedAt, created.IsDeleted);
    }

    public async Task<IEnumerable<CommentDto>> GetCommentsAsync(int incidentId)
    {
        var comments = await _commentRepository.GetByIncidentAsync(incidentId);
        return comments.Select(c => new CommentDto(c.Id, c.Content, c.IncidentId, c.AuthorId, c.Author?.FullName ?? c.Author?.Username ?? $"User#{c.AuthorId}", c.CreatedAt, c.IsDeleted));
    }

    public async Task<bool> DeleteAsync(int id)
        => await _incidentRepository.DeleteAsync(id);

    public async Task<int> GetCountAsync(int organizationId)
        => await _incidentRepository.GetCountByOrganizationAsync(organizationId);

    private static IncidentDto MapToDto(Incident incident)
    {
        return new IncidentDto(
            incident.Id,
            incident.Title,
            incident.Description,
            incident.Status,
            incident.Priority,
            incident.OrganizationId,
            incident.TeamId,
            incident.AssigneeId,
            incident.Assignee?.FullName,
            incident.ReporterId,
            incident.Reporter?.FullName ?? "Unknown",
            incident.CreatedAt,
            incident.UpdatedAt,
            incident.ResolvedAt,
            incident.Comments?.Count ?? 0
        );
    }

    private static IncidentListDto MapToListDto(Incident incident)
    {
        return new IncidentListDto(
            incident.Id.ToString(),
            incident.Title,
            incident.Status.ToString(),
            incident.Priority.ToString(),
            new UserSummaryDto(
                incident.ReporterId.ToString(),
                incident.Reporter?.Email ?? "",
                incident.Reporter?.FullName ?? "Unknown",
                incident.Reporter?.Role.ToString() ?? "User"
            ),
            incident.Assignee != null 
                ? new UserSummaryDto(
                    incident.AssigneeId?.ToString() ?? "",
                    incident.Assignee.Email,
                    incident.Assignee.FullName,
                    incident.Assignee.Role.ToString()
                )
                : null,
            incident.CreatedAt.ToString("o"),
            incident.Comments?.Count ?? 0
        );
    }

    private static IncidentDetailDto MapToDetailDto(Incident incident)
    {
        return new IncidentDetailDto(
            incident.Id.ToString(),
            incident.Title,
            incident.Description,
            incident.Status.ToString(),
            incident.Priority.ToString(),
            incident.OrganizationId.ToString(),
            new UserSummaryDto(
                incident.ReporterId.ToString(),
                incident.Reporter?.Email ?? "",
                incident.Reporter?.FullName ?? "Unknown",
                incident.Reporter?.Role.ToString() ?? "User"
            ),
            incident.Assignee != null 
                ? new UserSummaryDto(
                    incident.AssigneeId?.ToString() ?? "",
                    incident.Assignee.Email,
                    incident.Assignee.FullName,
                    incident.Assignee.Role.ToString()
                )
                : null,
            incident.Team != null
                ? new TeamSummaryDto(
                    incident.Team.Id.ToString(),
                    incident.Team.Name,
                    incident.Team.Members?.Count ?? 0
                )
                : null,
            incident.CreatedAt.ToString("o"),
            incident.UpdatedAt?.ToString("o"),
            incident.ResolvedAt?.ToString("o"),
            incident.ClosedAt?.ToString("o"),
            incident.Comments?.Count ?? 0
        );
    }
}
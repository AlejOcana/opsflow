using OpsFlow.Domain.Entities;
using OpsFlow.Domain.Enums;
using OpsFlow.Domain.Interfaces;
using OpsFlow.DTOs;

namespace OpsFlow.Services;

public interface IIncidentService
{
    Task<IEnumerable<IncidentListDto>> GetAllAsync(Guid organizationId);
    Task<IncidentDto?> GetByIdAsync(Guid id, Guid organizationId);
    Task<IncidentDto> CreateAsync(CreateIncidentRequest request, Guid createdByUserId, Guid organizationId);
    Task<IncidentDto?> UpdateAsync(Guid id, UpdateIncidentRequest request, Guid userId, Guid organizationId);
    Task<bool> DeleteAsync(Guid id, Guid userId, Guid organizationId);
    Task<IEnumerable<IncidentListDto>> GetByStatusAsync(Guid organizationId, IncidentStatus status);
    Task<IEnumerable<IncidentListDto>> SearchAsync(Guid organizationId, string searchTerm);
    Task<CommentDto?> AddCommentAsync(Guid incidentId, CreateCommentRequest request, Guid userId);
    Task<IEnumerable<CommentDto>> GetCommentsAsync(Guid incidentId);
}

public class IncidentService : IIncidentService
{
    private readonly IIncidentRepository _incidentRepository;
    private readonly IUserRepository _userRepository;
    private readonly ITeamRepository _teamRepository;
    private readonly ICommentRepository _commentRepository;
    private readonly IAuditLogRepository _auditLogRepository;

    public IncidentService(IIncidentRepository incidentRepository, IUserRepository userRepository, ITeamRepository teamRepository, ICommentRepository commentRepository, IAuditLogRepository auditLogRepository)
    {
        _incidentRepository = incidentRepository;
        _userRepository = userRepository;
        _teamRepository = teamRepository;
        _commentRepository = commentRepository;
        _auditLogRepository = auditLogRepository;
    }

    public async Task<IEnumerable<IncidentListDto>> GetAllAsync(Guid organizationId)
    {
        var incidents = await _incidentRepository.GetByOrganizationAsync(organizationId);
        return incidents.Select(MapToListDto);
    }

    public async Task<IncidentDto?> GetByIdAsync(Guid id, Guid organizationId)
    {
        var incident = await _incidentRepository.GetByIdAsync(id);
        if (incident == null || incident.OrganizationId != organizationId) return null;
        return MapToDto(incident);
    }

    public async Task<IncidentDto> CreateAsync(CreateIncidentRequest request, Guid createdByUserId, Guid organizationId)
    {
        var incident = new Incident
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            Status = IncidentStatus.New,
            Priority = Enum.Parse<IncidentPriority>(request.Priority, true),
            OrganizationId = organizationId,
            CreatedByUserId = createdByUserId,
            AssignedToUserId = request.AssignedToUserId,
            TeamId = request.TeamId,
            CreatedAt = DateTime.UtcNow
        };

        await _incidentRepository.AddAsync(incident);

        await _auditLogRepository.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            Action = "Created",
            EntityType = "Incident",
            EntityId = incident.Id,
            NewValues = System.Text.Json.JsonSerializer.Serialize(request),
            UserId = createdByUserId,
            IncidentId = incident.Id,
            CreatedAt = DateTime.UtcNow
        });

        var created = await _incidentRepository.GetByIdAsync(incident.Id);
        return MapToDto(created!);
    }

    public async Task<IncidentDto?> UpdateAsync(Guid id, UpdateIncidentRequest request, Guid userId, Guid organizationId)
    {
        var incident = await _incidentRepository.GetByIdAsync(id);
        if (incident == null || incident.OrganizationId != organizationId) return null;

        if (request.Title != null) incident.Title = request.Title;
        if (request.Description != null) incident.Description = request.Description;
        if (request.Priority != null) incident.Priority = Enum.Parse<IncidentPriority>(request.Priority, true);
        if (request.AssignedToUserId.HasValue) incident.AssignedToUserId = request.AssignedToUserId;
        if (request.TeamId.HasValue) incident.TeamId = request.TeamId;

        if (request.Status != null)
        {
            var oldStatus = incident.Status;
            incident.Status = Enum.Parse<IncidentStatus>(request.Status, true);
            if (incident.Status == IncidentStatus.Resolved) incident.ResolvedAt = DateTime.UtcNow;
            else if (incident.Status == IncidentStatus.Closed) incident.ClosedAt = DateTime.UtcNow;

            await _auditLogRepository.AddAsync(new AuditLog
            {
                Id = Guid.NewGuid(),
                Action = "StatusChanged",
                EntityType = "Incident",
                EntityId = incident.Id,
                OldValues = oldStatus.ToString(),
                NewValues = incident.Status.ToString(),
                UserId = userId,
                IncidentId = incident.Id,
                CreatedAt = DateTime.UtcNow
            });
        }

        incident.UpdatedAt = DateTime.UtcNow;
        await _incidentRepository.UpdateAsync(incident);
        return await GetByIdAsync(id, organizationId);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId, Guid organizationId)
    {
        var incident = await _incidentRepository.GetByIdAsync(id);
        if (incident == null || incident.OrganizationId != organizationId) return false;
        await _incidentRepository.DeleteAsync(id);
        return true;
    }

    public async Task<IEnumerable<IncidentListDto>> GetByStatusAsync(Guid organizationId, IncidentStatus status)
    {
        var incidents = await _incidentRepository.GetByStatusAsync(organizationId, status);
        return incidents.Select(MapToListDto);
    }

    public async Task<IEnumerable<IncidentListDto>> SearchAsync(Guid organizationId, string searchTerm)
    {
        var incidents = await _incidentRepository.SearchAsync(organizationId, searchTerm);
        return incidents.Select(MapToListDto);
    }

    public async Task<CommentDto?> AddCommentAsync(Guid incidentId, CreateCommentRequest request, Guid userId)
    {
        var incident = await _incidentRepository.GetByIdAsync(incidentId);
        if (incident == null) return null;

        var comment = new Comment { Id = Guid.NewGuid(), Content = request.Content, IncidentId = incidentId, UserId = userId, CreatedAt = DateTime.UtcNow };
        await _commentRepository.AddAsync(comment);

        var user = await _userRepository.GetByIdAsync(userId);
        return new CommentDto(comment.Id, comment.Content, comment.IncidentId, new UserSummaryDto(user!.Id, user.Email, $"{user.FirstName} {user.LastName}", user.Role.ToString()), comment.CreatedAt, comment.UpdatedAt);
    }

    public async Task<IEnumerable<CommentDto>> GetCommentsAsync(Guid incidentId)
    {
        var comments = await _commentRepository.GetByIncidentAsync(incidentId);
        return comments.Select(c => new CommentDto(c.Id, c.Content, c.IncidentId, new UserSummaryDto(c.User!.Id, c.User.Email, $"{c.User.FirstName} {c.User.LastName}", c.User.Role.ToString()), c.CreatedAt, c.UpdatedAt));
    }

    private static IncidentDto MapToDto(Incident i) => new(i.Id, i.Title, i.Description, i.Status.ToString(), i.Priority.ToString(), i.OrganizationId, new UserSummaryDto(i.CreatedByUser!.Id, i.CreatedByUser.Email, $"{i.CreatedByUser.FirstName} {i.CreatedByUser.LastName}", i.CreatedByUser.Role.ToString()), i.AssignedToUser != null ? new UserSummaryDto(i.AssignedToUser.Id, i.AssignedToUser.Email, $"{i.AssignedToUser.FirstName} {i.AssignedToUser.LastName}", i.AssignedToUser.Role.ToString()) : null, i.Team != null ? new TeamSummaryDto(i.Team.Id, i.Team.Name, i.Team.Members.Count) : null, i.CreatedAt, i.UpdatedAt, i.ResolvedAt, i.ClosedAt, i.Comments.Count);
    private static IncidentListDto MapToListDto(Incident i) => new(i.Id, i.Title, i.Status.ToString(), i.Priority.ToString(), new UserSummaryDto(i.CreatedByUser!.Id, i.CreatedByUser.Email, $"{i.CreatedByUser.FirstName} {i.CreatedByUser.LastName}", i.CreatedByUser.Role.ToString()), i.AssignedToUser != null ? new UserSummaryDto(i.AssignedToUser.Id, i.AssignedToUser.Email, $"{i.AssignedToUser.FirstName} {i.AssignedToUser.LastName}", i.AssignedToUser.Role.ToString()) : null, i.CreatedAt, i.Comments.Count);
}
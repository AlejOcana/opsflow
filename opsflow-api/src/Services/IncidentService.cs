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
}

public class IncidentService : IIncidentService
{
    private readonly IIncidentRepository _incidentRepository;
    private readonly IUserRepository _userRepository;
    private readonly ITeamRepository _teamRepository;
    private readonly IOrganizationRepository _organizationRepository;

    public IncidentService(
        IIncidentRepository incidentRepository,
        IUserRepository userRepository,
        ITeamRepository teamRepository,
        IOrganizationRepository organizationRepository)
    {
        _incidentRepository = incidentRepository;
        _userRepository = userRepository;
        _teamRepository = teamRepository;
        _organizationRepository = organizationRepository;
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
        return MapToDto(created);
    }

    public async Task<IncidentDto?> UpdateAsync(int id, UpdateIncidentRequest request, int userId)
    {
        var incident = await _incidentRepository.GetByIdWithDetailsAsync(id);
        if (incident == null) return null;

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
        return MapToDto(updated);
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
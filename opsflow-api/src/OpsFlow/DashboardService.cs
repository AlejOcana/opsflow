using OpsFlow.Domain.Enums;
using OpsFlow.Domain.Interfaces;
using OpsFlow.DTOs;

namespace OpsFlow.Services;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync(Guid organizationId);
}

public class DashboardService : IDashboardService
{
    private readonly IIncidentRepository _incidentRepository;
    private readonly IUserRepository _userRepository;
    private readonly ITeamRepository _teamRepository;

    public DashboardService(IIncidentRepository incidentRepository, IUserRepository userRepository, ITeamRepository teamRepository)
    {
        _incidentRepository = incidentRepository;
        _userRepository = userRepository;
        _teamRepository = teamRepository;
    }

    public async Task<DashboardStatsDto> GetStatsAsync(Guid organizationId)
    {
        var incidents = (await _incidentRepository.GetByOrganizationAsync(organizationId)).ToList();
        var users = await _userRepository.GetByOrganizationAsync(organizationId);
        var teams = await _teamRepository.GetByOrganizationAsync(organizationId);

        return new DashboardStatsDto(
            incidents.Count,
            incidents.Count(i => i.Status == IncidentStatus.New),
            incidents.Count(i => i.Status == IncidentStatus.InProgress),
            incidents.Count(i => i.Status == IncidentStatus.Resolved),
            incidents.Count(i => i.Status == IncidentStatus.Closed),
            incidents.Count(i => i.Priority == IncidentPriority.Critical),
            incidents.Count(i => i.Priority == IncidentPriority.High),
            teams.Count(),
            users.Count()
        );
    }
}
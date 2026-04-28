using OpsFlow.Api.Data;
using OpsFlow.Api.DTOs;
using OpsFlow.Api.Models;

namespace OpsFlow.Api.Services;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync(int organizationId);
    Task<IEnumerable<IncidentTrendDto>> GetTrendAsync(int organizationId, int days = 30);
}

public class DashboardService : IDashboardService
{
    private readonly IIncidentRepository _incidentRepository;
    private readonly IUserRepository _userRepository;
    private readonly ITeamRepository _teamRepository;
    private readonly IOrganizationRepository _organizationRepository;

    public DashboardService(
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

    public async Task<DashboardStatsDto> GetStatsAsync(int organizationId)
    {
        var totalIncidents = await _incidentRepository.GetCountByOrganizationAsync(organizationId);
        var openIncidents = await _incidentRepository.GetCountByStatusAsync(IncidentStatus.Open);
        var inProgressIncidents = await _incidentRepository.GetCountByStatusAsync(IncidentStatus.InProgress);
        var resolvedIncidents = await _incidentRepository.GetCountByStatusAsync(IncidentStatus.Resolved);
        var closedIncidents = await _incidentRepository.GetCountByStatusAsync(IncidentStatus.Closed);

        var criticalCount = await _incidentRepository.GetCountByPriorityAsync(IncidentPriority.Critical);
        var highCount = await _incidentRepository.GetCountByPriorityAsync(IncidentPriority.High);
        var mediumCount = await _incidentRepository.GetCountByPriorityAsync(IncidentPriority.Medium);
        var lowCount = await _incidentRepository.GetCountByPriorityAsync(IncidentPriority.Low);

        var totalUsers = (await _userRepository.GetByOrganizationAsync(organizationId)).Count();
        var totalTeams = (await _teamRepository.GetByOrganizationAsync(organizationId)).Count();
        var totalOrganizations = (await _organizationRepository.GetAllAsync()).Count();

        return new DashboardStatsDto(
            totalIncidents,
            openIncidents,
            inProgressIncidents,
            resolvedIncidents,
            closedIncidents,
            criticalCount,
            highCount,
            mediumCount,
            lowCount,
            totalUsers,
            totalTeams,
            totalOrganizations
        );
    }

    public async Task<IEnumerable<IncidentTrendDto>> GetTrendAsync(int organizationId, int days = 30)
        => await _incidentRepository.GetTrendAsync(organizationId, days);
}
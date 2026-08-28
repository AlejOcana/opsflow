using Microsoft.EntityFrameworkCore;
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
    private readonly OpsFlowDbContext _context;

    public DashboardService(
        IIncidentRepository incidentRepository,
        IUserRepository userRepository,
        ITeamRepository teamRepository,
        IOrganizationRepository organizationRepository,
        OpsFlowDbContext context)
    {
        _incidentRepository = incidentRepository;
        _userRepository = userRepository;
        _teamRepository = teamRepository;
        _organizationRepository = organizationRepository;
        _context = context;
    }

    public async Task<DashboardStatsDto> GetStatsAsync(int organizationId)
    {
        var totalIncidents = await _incidentRepository.GetCountByOrganizationAsync(organizationId);
        // Scoped per-tenant counts — previously leaked across Neon tenants via global GetCountBy* calls
        var openIncidents = await _context.Incidents.CountAsync(i => i.OrganizationId == organizationId && i.Status == IncidentStatus.Open);
        var inProgressIncidents = await _context.Incidents.CountAsync(i => i.OrganizationId == organizationId && i.Status == IncidentStatus.InProgress);
        var resolvedIncidents = await _context.Incidents.CountAsync(i => i.OrganizationId == organizationId && i.Status == IncidentStatus.Resolved);
        var closedIncidents = await _context.Incidents.CountAsync(i => i.OrganizationId == organizationId && i.Status == IncidentStatus.Closed);

        var criticalCount = await _context.Incidents.CountAsync(i => i.OrganizationId == organizationId && i.Priority == IncidentPriority.Critical);
        var highCount = await _context.Incidents.CountAsync(i => i.OrganizationId == organizationId && i.Priority == IncidentPriority.High);
        var mediumCount = await _context.Incidents.CountAsync(i => i.OrganizationId == organizationId && i.Priority == IncidentPriority.Medium);
        var lowCount = await _context.Incidents.CountAsync(i => i.OrganizationId == organizationId && i.Priority == IncidentPriority.Low);

        var totalUsers = (await _userRepository.GetByOrganizationAsync(organizationId)).Count();
        var totalTeams = (await _teamRepository.GetByOrganizationAsync(organizationId)).Count();
        var totalOrganizations = (await _organizationRepository.GetAllAsync()).Count();

        // --- Phase 2 KPI expansion (additive, from existing Incidents) ---
        // Open by severity (actually Priority): count of open+inProgress grouped by priority
        var openBySeverityRaw = await _context.Incidents
            .Where(i => i.OrganizationId == organizationId && (i.Status == IncidentStatus.Open || i.Status == IncidentStatus.InProgress))
            .GroupBy(i => i.Priority)
            .Select(g => new { Priority = g.Key, Count = g.Count() })
            .ToListAsync();

        var openBySeverity = openBySeverityRaw
            .Select(x => new OpenBySeverityDto(x.Priority.ToString(), x.Count))
            .ToList();

        // Ensure all priorities appear even if zero
        foreach (IncidentPriority p in Enum.GetValues(typeof(IncidentPriority)))
        {
            if (!openBySeverity.Any(o => o.Severity == p.ToString()))
                openBySeverity.Add(new OpenBySeverityDto(p.ToString(), 0));
        }

        // MTBF: mean time between failures simulated = avg interval between CreatedAt sorted
        double mtbfHours = 0;
        var createdTimes = await _context.Incidents
            .Where(i => i.OrganizationId == organizationId)
            .OrderBy(i => i.CreatedAt)
            .Select(i => i.CreatedAt)
            .ToListAsync();
        if (createdTimes.Count > 1)
        {
            var intervals = new List<double>();
            for (int i = 1; i < createdTimes.Count; i++)
                intervals.Add((createdTimes[i] - createdTimes[i - 1]).TotalHours);
            mtbfHours = intervals.Average();
        }

        // Lead time avg days Open->Resolved (ResolvedAt - CreatedAt for resolved/closed)
        double leadTimeAvgDays = 0;
        var leadTimes = await _context.Incidents
            .Where(i => i.OrganizationId == organizationId && i.ResolvedAt != null)
            .Select(i => (i.ResolvedAt!.Value - i.CreatedAt).TotalDays)
            .ToListAsync();
        if (leadTimes.Count > 0) leadTimeAvgDays = leadTimes.Average();

        // SLA at risk: count of High/Critical that are Open/InProgress older than 2 days (High) / 1 day (Critical) or Medium older than 7 days
        var now = DateTime.UtcNow;
        var slaAtRisk = await _context.Incidents
            .Where(i => i.OrganizationId == organizationId && (i.Status == IncidentStatus.Open || i.Status == IncidentStatus.InProgress)
                && (
                    (i.Priority == IncidentPriority.Critical && i.CreatedAt < now.AddDays(-1)) ||
                    (i.Priority == IncidentPriority.High && i.CreatedAt < now.AddDays(-2)) ||
                    (i.Priority == IncidentPriority.Medium && i.CreatedAt < now.AddDays(-7)) ||
                    (i.Priority == IncidentPriority.Low && i.CreatedAt < now.AddDays(-14))
                ))
            .CountAsync();

        // Throughput last 7 days
        var throughputLast7Days = await _incidentRepository.GetTrendAsync(organizationId, 7);

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
            totalOrganizations,
            OpenBySeverity: openBySeverity,
            MtbfHours: Math.Round(mtbfHours, 2),
            LeadTimeAvgDays: Math.Round(leadTimeAvgDays, 2),
            SlaAtRisk: slaAtRisk,
            ThroughputLast7Days: throughputLast7Days
        );
    }

    public async Task<IEnumerable<IncidentTrendDto>> GetTrendAsync(int organizationId, int days = 30)
        => await _incidentRepository.GetTrendAsync(organizationId, days);
}
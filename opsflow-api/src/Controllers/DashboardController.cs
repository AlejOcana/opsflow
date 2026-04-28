using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpsFlow.Api.DTOs;
using OpsFlow.Api.Services;

namespace OpsFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats([FromQuery] int organizationId = 1)
    {
        var stats = await _dashboardService.GetStatsAsync(organizationId);
        return Ok(stats);
    }

    [HttpGet("trend")]
    public async Task<ActionResult<IEnumerable<IncidentTrendDto>>> GetTrend(
        [FromQuery] int organizationId = 1,
        [FromQuery] int days = 30)
    {
        var trend = await _dashboardService.GetTrendAsync(organizationId, days);
        return Ok(trend);
    }
}
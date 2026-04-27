using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpsFlow.Services;

namespace OpsFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService) { _dashboardService = dashboardService; }

    private Guid GetOrganizationId() => Guid.Parse(User.Claims.First(c => c.Type == "organizationId").Value);

    [HttpGet]
    public async Task<IActionResult> GetStats() => Ok(await _dashboardService.GetStatsAsync(GetOrganizationId()));
}
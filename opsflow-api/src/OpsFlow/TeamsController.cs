using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpsFlow.DTOs;
using OpsFlow.Services;

namespace OpsFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TeamsController : ControllerBase
{
    private readonly ITeamService _teamService;

    public TeamsController(ITeamService teamService) { _teamService = teamService; }

    private Guid GetOrganizationId() => Guid.Parse(User.Claims.First(c => c.Type == "organizationId").Value);

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _teamService.GetAllAsync(GetOrganizationId()));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var team = await _teamService.GetByIdAsync(id, GetOrganizationId());
        return team == null ? NotFound() : Ok(team);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTeamRequest request)
    {
        var team = await _teamService.CreateAsync(request.Name, request.Description, GetOrganizationId());
        return CreatedAtAction(nameof(GetById), new { id = team.Id }, team);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateTeamRequest request)
    {
        var team = await _teamService.UpdateAsync(id, request.Name, request.Description, GetOrganizationId());
        return team == null ? NotFound() : Ok(team);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id) => await _teamService.DeleteAsync(id, GetOrganizationId()) ? NoContent() : NotFound();
}
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpsFlow.Api.DTOs;
using OpsFlow.Api.Services;

namespace OpsFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TeamsController : ControllerBase
{
    private readonly ITeamService _teamService;

    public TeamsController(ITeamService teamService)
    {
        _teamService = teamService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TeamDto>>> GetAll()
    {
        var teams = await _teamService.GetAllAsync();
        return Ok(teams);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TeamDto>> GetById(int id)
    {
        var team = await _teamService.GetByIdAsync(id);
        if (team == null)
            return NotFound();
        return Ok(team);
    }

    [HttpGet("organization/{organizationId}")]
    public async Task<ActionResult<IEnumerable<TeamDto>>> GetByOrganization(int organizationId)
    {
        var teams = await _teamService.GetByOrganizationAsync(organizationId);
        return Ok(teams);
    }

    [HttpPost]
    public async Task<ActionResult<TeamDto>> Create([FromBody] CreateTeamRequest request)
    {
        try
        {
            var team = await _teamService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = team.Id }, team);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TeamDto>> Update(int id, [FromBody] UpdateTeamRequest request)
    {
        try
        {
            var team = await _teamService.UpdateAsync(id, request);
            if (team == null)
                return NotFound();
            return Ok(team);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var result = await _teamService.DeleteAsync(id);
        if (!result)
            return NotFound();
        return NoContent();
    }
}
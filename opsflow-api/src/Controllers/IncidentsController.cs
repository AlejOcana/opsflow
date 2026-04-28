using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpsFlow.Api.DTOs;
using OpsFlow.Api.Models;
using OpsFlow.Api.Services;

namespace OpsFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IncidentsController : ControllerBase
{
    private readonly IIncidentService _incidentService;

    public IncidentsController(IIncidentService incidentService)
    {
        _incidentService = incidentService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<IncidentListDto>>> GetAll(
        [FromQuery] int organizationId = 1,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var incidents = await _incidentService.GetAllForFrontendAsync(organizationId, status, search, page, pageSize);
        return Ok(incidents);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<IncidentDto>> GetById(int id)
    {
        var incident = await _incidentService.GetByIdAsync(id);
        if (incident == null)
            return NotFound();
        return Ok(incident);
    }

    [HttpGet("team/{teamId}")]
    public async Task<ActionResult<IEnumerable<IncidentDto>>> GetByTeam(
        int teamId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var incidents = await _incidentService.GetByTeamAsync(teamId, page, pageSize);
        return Ok(incidents);
    }

    [HttpGet("status/{status}")]
    public async Task<ActionResult<IEnumerable<IncidentDto>>> GetByStatus(
        int organizationId,
        IncidentStatus status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var incidents = await _incidentService.GetByStatusAsync(organizationId, status, page, pageSize);
        return Ok(incidents);
    }

    [HttpGet("priority/{priority}")]
    public async Task<ActionResult<IEnumerable<IncidentDto>>> GetByPriority(
        int organizationId,
        IncidentPriority priority,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var incidents = await _incidentService.GetByPriorityAsync(organizationId, priority, page, pageSize);
        return Ok(incidents);
    }

    [HttpGet("assignee/{assigneeId}")]
    public async Task<ActionResult<IEnumerable<IncidentDto>>> GetByAssignee(
        int assigneeId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var incidents = await _incidentService.GetByAssigneeAsync(assigneeId, page, pageSize);
        return Ok(incidents);
    }

    [HttpPost]
    public async Task<ActionResult<IncidentDto>> Create([FromBody] CreateIncidentRequest request)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var incident = await _incidentService.CreateAsync(request, userId);
        return CreatedAtAction(nameof(GetById), new { id = incident.Id }, incident);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<IncidentDto>> Update(int id, [FromBody] UpdateIncidentRequest request)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var incident = await _incidentService.UpdateAsync(id, request, userId);
        if (incident == null)
            return NotFound();
        return Ok(incident);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var result = await _incidentService.DeleteAsync(id);
        if (!result)
            return NotFound();
        return NoContent();
    }
}
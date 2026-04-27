using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpsFlow.Domain.Enums;
using OpsFlow.DTOs;
using OpsFlow.Services;

namespace OpsFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IncidentsController : ControllerBase
{
    private readonly IIncidentService _incidentService;

    public IncidentsController(IIncidentService incidentService) { _incidentService = incidentService; }

    private Guid GetOrganizationId() => Guid.Parse(User.Claims.First(c => c.Type == "organizationId").Value);

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] string? search)
    {
        var orgId = GetOrganizationId();
        if (!string.IsNullOrEmpty(search)) return Ok(await _incidentService.SearchAsync(orgId, search));
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<IncidentStatus>(status, true, out var statusEnum)) return Ok(await _incidentService.GetByStatusAsync(orgId, statusEnum));
        return Ok(await _incidentService.GetAllAsync(orgId));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var incident = await _incidentService.GetByIdAsync(id, GetOrganizationId());
        return incident == null ? NotFound() : Ok(incident);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateIncidentRequest request)
    {
        var userId = Guid.Parse(User.Claims.First(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier).Value);
        var incident = await _incidentService.CreateAsync(request, userId, GetOrganizationId());
        return CreatedAtAction(nameof(GetById), new { id = incident.Id }, incident);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateIncidentRequest request)
    {
        var userId = Guid.Parse(User.Claims.First(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier).Value);
        var result = await _incidentService.UpdateAsync(id, request, userId, GetOrganizationId());
        return result == null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = Guid.Parse(User.Claims.First(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier).Value);
        return await _incidentService.DeleteAsync(id, userId, GetOrganizationId()) ? NoContent() : NotFound();
    }

    [HttpGet("{id:guid}/comments")]
    public async Task<IActionResult> GetComments(Guid id) => Ok(await _incidentService.GetCommentsAsync(id));

    [HttpPost("{id:guid}/comments")]
    public async Task<IActionResult> AddComment(Guid id, [FromBody] CreateCommentRequest request)
    {
        var userId = Guid.Parse(User.Claims.First(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier).Value);
        var comment = await _incidentService.AddCommentAsync(id, request, userId);
        return comment == null ? NotFound() : Ok(comment);
    }
}
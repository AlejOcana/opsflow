using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpsFlow.Api.Data;
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
    private readonly ITimelineService _timelineService;
    private readonly IAttachmentService _attachmentService;
    private readonly OpsFlowDbContext _context;

    public IncidentsController(IIncidentService incidentService, ITimelineService timelineService, IAttachmentService attachmentService, OpsFlowDbContext context)
    {
        _incidentService = incidentService;
        _timelineService = timelineService;
        _attachmentService = attachmentService;
        _context = context;
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
    [Authorize(Policy = "CanCreate")]
    public async Task<ActionResult<IncidentDto>> Create([FromBody] CreateIncidentRequest request)
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        if (role == UserRole.User.ToString()) return Forbid();
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var incident = await _incidentService.CreateAsync(request, userId);
        return CreatedAtAction(nameof(GetById), new { id = incident.Id }, incident);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<IncidentDto>> Update(int id, [FromBody] UpdateIncidentRequest request)
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        if (role == UserRole.User.ToString()) return Forbid();
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

        // Contributor (Operator) can only change own assigned incidents - check status change
        if (role == UserRole.Operator.ToString() && request.Status.HasValue)
        {
            var existing = await _incidentService.GetByIdAsync(id);
            if (existing == null) return NotFound();
            // need to verify assignee is current user: fetch via context or service - quick check via GetById
            // If not assigned to caller, forbid
            var incidentEntity = await _context.Incidents.FindAsync(id);
            if (incidentEntity?.AssigneeId != userId) return Forbid();
        }

        var incident = await _incidentService.UpdateAsync(id, request, userId);
        if (incident == null)
            return NotFound();
        return Ok(incident);
    }

    [HttpPatch("{id}/assign")]
    [Authorize(Policy = "CanAssign")]
    public async Task<ActionResult<IncidentDto>> Assign(int id, [FromBody] AssignRequest request)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        try
        {
            var incident = await _incidentService.AssignAsync(id, request.AssigneeId, userId);
            if (incident == null) return NotFound();
            return Ok(incident);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<IncidentDto>> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        if (role == UserRole.User.ToString()) return Forbid();
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

        if (role == UserRole.Operator.ToString())
        {
            var incidentEntity = await _context.Incidents.FindAsync(id);
            if (incidentEntity?.AssigneeId != userId) return Forbid();
        }

        if (!Enum.TryParse<IncidentStatus>(request.Status, true, out var statusEnum))
            return BadRequest(new { message = $"Invalid status {request.Status}" });

        var incident = await _incidentService.UpdateStatusAsync(id, statusEnum, userId);
        if (incident == null) return NotFound();
        return Ok(incident);
    }

    [HttpGet("{id}/timeline")]
    public async Task<ActionResult<IEnumerable<TimelineEntryDto>>> GetTimeline(int id)
    {
        // verify incident exists
        if (!await _context.Incidents.AnyAsync(i => i.Id == id)) return NotFound();
        var timeline = await _timelineService.BuildTimelineAsync(id);
        return Ok(timeline);
    }

    [HttpGet("{id}/comments")]
    public async Task<ActionResult<IEnumerable<CommentDto>>> GetComments(int id)
    {
        if (!await _context.Incidents.AnyAsync(i => i.Id == id)) return NotFound();
        var comments = await _incidentService.GetCommentsAsync(id);
        return Ok(comments);
    }

    [HttpPost("{id}/comments")]
    [Authorize(Policy = "CanCreate")]
    public async Task<ActionResult<CommentDto>> AddComment(int id, [FromBody] CreateCommentBody request)
    {
        if (string.IsNullOrWhiteSpace(request.Content)) return BadRequest(new { message = "Content required" });
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        try
        {
            var comment = await _incidentService.AddCommentAsync(id, request.Content, userId);
            return CreatedAtAction(nameof(GetComments), new { id }, comment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id}/attachments")]
    public async Task<ActionResult<IEnumerable<AttachmentDto>>> GetAttachments(int id)
    {
        if (!await _context.Incidents.AnyAsync(i => i.Id == id)) return NotFound();
        var list = await _attachmentService.GetByIncidentAsync(id);
        return Ok(list);
    }

    [HttpPost("{id}/attachments")]
    [Authorize(Policy = "ContributorPlus")]
    public async Task<ActionResult<AttachmentDto>> AddAttachment(int id, [FromBody] CreateAttachmentRequest request)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        try
        {
            var att = await _attachmentService.CreateAsync(id, request, userId);
            return CreatedAtAction(nameof(GetAttachments), new { id }, att);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}/attachments/{attachmentId}")]
    [Authorize(Policy = "CanDeleteAttachment")]
    public async Task<ActionResult> DeleteAttachment(int id, int attachmentId)
    {
        var ok = await _attachmentService.DeleteAsync(id, attachmentId);
        if (!ok) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "CanDelete")]
    public async Task<ActionResult> Delete(int id)
    {
        var result = await _incidentService.DeleteAsync(id);
        if (!result)
            return NotFound();
        return NoContent();
    }
}

public record AssignRequest(int AssigneeId);
public record UpdateStatusRequest(string Status);
public record CreateCommentBody(string Content);
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpsFlow.Api.DTOs;
using OpsFlow.Api.Services;

namespace OpsFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _service;

    public NotificationsController(INotificationService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<NotificationDto>>> GetMine([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var list = await _service.GetByUserAsync(userId, page, pageSize);
        return Ok(list);
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var count = await _service.GetUnreadCountAsync(userId);
        return Ok(new { count });
    }

    [HttpPatch("{id}/read")]
    public async Task<ActionResult> MarkRead(int id)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var ok = await _service.MarkReadAsync(id, userId);
        if (!ok) return NotFound(new { message = "Notification not found or not owned" });
        return Ok(new { success = true });
    }

    [HttpPost("read-all")]
    public async Task<ActionResult> MarkAllRead()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        await _service.MarkAllReadAsync(userId);
        return Ok(new { success = true });
    }
}

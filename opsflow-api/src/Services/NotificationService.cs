using OpsFlow.Api.Data;
using OpsFlow.Api.DTOs;
using OpsFlow.Api.Models;

namespace OpsFlow.Api.Services;

public interface INotificationService
{
    Task<NotificationDto> CreateAsync(int userId, int? incidentId, NotificationType type, string title, string message);
    Task<IEnumerable<NotificationDto>> GetByUserAsync(int userId, int page, int pageSize);
    Task<int> GetUnreadCountAsync(int userId);
    Task<bool> MarkReadAsync(int notificationId, int userId);
    Task<bool> MarkAllReadAsync(int userId);
}

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _repo;

    public NotificationService(INotificationRepository repo)
    {
        _repo = repo;
    }

    public async Task<NotificationDto> CreateAsync(int userId, int? incidentId, NotificationType type, string title, string message)
    {
        var n = new Notification
        {
            UserId = userId,
            IncidentId = incidentId,
            Type = type,
            Title = title,
            Message = message,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        var created = await _repo.AddAsync(n);
        return Map(created);
    }

    public async Task<IEnumerable<NotificationDto>> GetByUserAsync(int userId, int page, int pageSize)
    {
        var list = await _repo.GetByUserAsync(userId, page, pageSize);
        return list.Select(Map);
    }

    public async Task<int> GetUnreadCountAsync(int userId) => await _repo.GetUnreadCountAsync(userId);

    public async Task<bool> MarkReadAsync(int notificationId, int userId)
    {
        var n = await _repo.GetByIdAsync(notificationId);
        if (n == null) return false;
        if (n.UserId != userId) return false; // own user only
        if (!n.IsRead)
        {
            n.IsRead = true;
            await _repo.UpdateAsync(n);
        }
        return true;
    }

    public async Task<bool> MarkAllReadAsync(int userId) => await _repo.MarkAllReadAsync(userId);

    private static NotificationDto Map(Notification n) =>
        new(n.Id, n.UserId, n.IncidentId, n.Type.ToString(), n.Title, n.Message, n.IsRead, n.CreatedAt);
}

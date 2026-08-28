using OpsFlow.Api.Data;
using OpsFlow.Api.DTOs;

namespace OpsFlow.Api.Services;

public interface ITimelineService
{
    Task<IEnumerable<TimelineEntryDto>> BuildTimelineAsync(int incidentId);
}

public class TimelineService : ITimelineService
{
    private readonly ICommentRepository _comments;
    private readonly IAuditLogRepository _audits;
    private readonly IIncidentAttachmentRepository _attachments;

    public TimelineService(ICommentRepository comments, IAuditLogRepository audits, IIncidentAttachmentRepository attachments)
    {
        _comments = comments;
        _audits = audits;
        _attachments = attachments;
    }

    public async Task<IEnumerable<TimelineEntryDto>> BuildTimelineAsync(int incidentId)
    {
        var comments = await _comments.GetByIncidentAsync(incidentId);
        var audits = await _audits.GetByEntityAsync("Incident", incidentId);
        var attachments = await _attachments.GetByIncidentAsync(incidentId);

        var entries = new List<TimelineEntryDto>();

        foreach (var c in comments)
        {
            entries.Add(new TimelineEntryDto(
                Type: "comment",
                At: c.CreatedAt,
                Actor: c.Author?.FullName ?? c.Author?.Username ?? $"User#{c.AuthorId}",
                Content: c.Content,
                Metadata: new Dictionary<string, object?> { ["commentId"] = c.Id, ["authorId"] = c.AuthorId }
            ));
        }

        foreach (var a in audits)
        {
            var isStatus = a.Action != null && (a.Action.Contains("Status", StringComparison.OrdinalIgnoreCase) || a.Action.Equals("StatusChanged", StringComparison.OrdinalIgnoreCase));
            var type = isStatus ? "status" : "audit";
            entries.Add(new TimelineEntryDto(
                Type: type,
                At: a.CreatedAt,
                Actor: a.User?.FullName ?? a.User?.Username ?? $"User#{a.UserId}",
                Content: $"{a.Action}: {a.OldValue ?? ""} -> {a.NewValue ?? ""}".Trim(),
                Metadata: new Dictionary<string, object?> { ["auditId"] = a.Id, ["action"] = a.Action, ["oldValue"] = a.OldValue, ["newValue"] = a.NewValue }
            ));
        }

        foreach (var att in attachments)
        {
            entries.Add(new TimelineEntryDto(
                Type: "attachment",
                At: att.UploadedAt,
                Actor: att.UploadedBy?.FullName ?? att.UploadedBy?.Username ?? $"User#{att.UploadedById}",
                Content: $"Attachment added: {att.FileName}",
                Metadata: new Dictionary<string, object?> { ["attachmentId"] = att.Id, ["fileName"] = att.FileName, ["url"] = att.Url, ["contentType"] = att.ContentType, ["sizeBytes"] = att.SizeBytes }
            ));
        }

        return entries.OrderBy(e => e.At);
    }
}

using OpsFlow.Api.Data;
using OpsFlow.Api.DTOs;
using OpsFlow.Api.Models;

namespace OpsFlow.Api.Services;

public interface IAttachmentService
{
    Task<IEnumerable<AttachmentDto>> GetByIncidentAsync(int incidentId);
    Task<AttachmentDto> CreateAsync(int incidentId, CreateAttachmentRequest request, int uploadedById);
    Task<bool> DeleteAsync(int incidentId, int attachmentId);
}

public class AttachmentService : IAttachmentService
{
    private readonly IIncidentAttachmentRepository _repo;
    private readonly IIncidentRepository _incidentRepo;
    private readonly IUserRepository _userRepo;

    public AttachmentService(IIncidentAttachmentRepository repo, IIncidentRepository incidentRepo, IUserRepository userRepo)
    {
        _repo = repo;
        _incidentRepo = incidentRepo;
        _userRepo = userRepo;
    }

    public async Task<IEnumerable<AttachmentDto>> GetByIncidentAsync(int incidentId)
    {
        var list = await _repo.GetByIncidentAsync(incidentId);
        return list.Select(Map);
    }

    public async Task<AttachmentDto> CreateAsync(int incidentId, CreateAttachmentRequest request, int uploadedById)
    {
        var incident = await _incidentRepo.GetByIdAsync(incidentId) ?? throw new InvalidOperationException("Incident not found");
        var user = await _userRepo.GetByIdAsync(uploadedById);

        var contentType = request.ContentType ?? InferContentType(request.FileName, request.Url);
        var size = request.SizeBytes ?? EstimateSize(request.Url);

        var entity = new IncidentAttachment
        {
            IncidentId = incidentId,
            FileName = request.FileName.Trim(),
            ContentType = contentType,
            Url = request.Url.Trim(),
            UploadedById = uploadedById,
            UploadedAt = DateTime.UtcNow,
            SizeBytes = size
        };
        var created = await _repo.AddAsync(entity);
        // reload to get navigation
        var withUser = await _repo.GetByIdAsync(created.Id);
        return Map(withUser ?? created);
    }

    public async Task<bool> DeleteAsync(int incidentId, int attachmentId)
    {
        var att = await _repo.GetByIdAsync(attachmentId);
        if (att == null) return false;
        if (att.IncidentId != incidentId) return false;
        return await _repo.DeleteAsync(attachmentId);
    }

    private static AttachmentDto Map(IncidentAttachment a) =>
        new(a.Id, a.IncidentId, a.FileName, a.ContentType, a.Url, a.UploadedById, a.UploadedBy?.FullName ?? a.UploadedBy?.Username ?? $"User#{a.UploadedById}", a.UploadedAt, a.SizeBytes);

    private static string InferContentType(string fileName, string url)
    {
        if (!string.IsNullOrWhiteSpace(url) && url.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
        {
            var semi = url.IndexOf(';');
            if (semi > 5) return url.Substring(5, semi - 5);
        }
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        return ext switch
        {
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".gif" => "image/gif",
            ".pdf" => "application/pdf",
            ".txt" => "text/plain",
            ".log" => "text/plain",
            ".json" => "application/json",
            ".zip" => "application/zip",
            _ => "application/octet-stream"
        };
    }

    private static long EstimateSize(string url)
    {
        if (url.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
        {
            var idx = url.IndexOf(";base64,", StringComparison.OrdinalIgnoreCase);
            if (idx >= 0)
            {
                var b64 = url.Substring(idx + 8);
                // approx size
                return (long)(b64.Length * 3 / 4);
            }
        }
        return url.Length;
    }
}

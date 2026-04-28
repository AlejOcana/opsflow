using OpsFlow.Api.Models;

namespace OpsFlow.Api.DTOs;

// Authentication DTOs
public record LoginRequest(string? Username, string? Email, string Password);
public record RegisterRequest(string Username, string Email, string Password, string FullName, int? OrganizationId = null);
public record AuthResponse(string Token, int UserId, string Username, string Email, string FullName, UserRole Role);

// User DTOs
public record CreateUserRequest(string Username, string Email, string Password, string FullName, UserRole Role, int? OrganizationId, int? TeamId);
public record UpdateUserRequest(string? Email, string? FullName, UserRole? Role, int? TeamId, bool? IsActive);
public record UserDto(int Id, string Username, string Email, string FullName, UserRole Role, int? OrganizationId, int? TeamId, DateTime CreatedAt, bool IsActive);

// Organization DTOs
public record CreateOrganizationRequest(string Name, string Description, string? ContactEmail);
public record UpdateOrganizationRequest(string? Name, string? Description, string? ContactEmail, bool? IsActive);
public record OrganizationDto(int Id, string Name, string Description, string? ContactEmail, DateTime CreatedAt, bool IsActive, int UserCount, int TeamCount, int IncidentCount);

// Team DTOs
public record CreateTeamRequest(string Name, string? Description, int OrganizationId, int? ManagerId);
public record UpdateTeamRequest(string? Name, string? Description, int? ManagerId, bool? IsActive);
public record TeamDto(int Id, string Name, string? Description, int OrganizationId, int? ManagerId, string? ManagerName, DateTime CreatedAt, bool IsActive, int MemberCount, int IncidentCount, IEnumerable<TeamMemberDto>? Members);

public record TeamMemberDto(int Id, string FullName, string Email, string Role);

// Incident DTOs
public record CreateIncidentRequest(string Title, string Description, IncidentPriority Priority, int OrganizationId, int? TeamId, int? AssigneeId);
public record UpdateIncidentRequest(string? Title, string? Description, IncidentStatus? Status, IncidentPriority? Priority, int? TeamId, int? AssigneeId);
public record IncidentDto(int Id, string Title, string Description, IncidentStatus Status, IncidentPriority Priority, int OrganizationId, int? TeamId, int? AssigneeId, string? AssigneeName, int ReporterId, string ReporterName, DateTime CreatedAt, DateTime? UpdatedAt, DateTime? ResolvedAt, int CommentCount);

// Frontend-compatible Incident DTO
public record IncidentListDto(
    string Id,
    string Title,
    string Status,
    string Priority,
    UserSummaryDto CreatedBy,
    UserSummaryDto? AssignedTo,
    string CreatedAt,
    int CommentCount
);

// Frontend-compatible Incident Detail DTO
public record IncidentDetailDto(
    string Id,
    string Title,
    string Description,
    string Status,
    string Priority,
    string OrganizationId,
    UserSummaryDto CreatedBy,
    UserSummaryDto? AssignedTo,
    TeamSummaryDto? Team,
    string CreatedAt,
    string? UpdatedAt,
    string? ResolvedAt,
    string? ClosedAt,
    int CommentCount
);

public record TeamSummaryDto(string Id, string Name, int MemberCount);

public record UserSummaryDto(string Id, string Email, string FullName, string Role);

// Comment DTOs
public record CreateCommentRequest(int IncidentId, string Content);
public record UpdateCommentRequest(string Content);
public record CommentDto(int Id, string Content, int IncidentId, int AuthorId, string AuthorName, DateTime CreatedAt, bool IsDeleted);

// Dashboard DTOs
public record DashboardStatsDto(int TotalIncidents, int OpenIncidents, int InProgressIncidents, int ResolvedIncidents, int ClosedIncidents, int CriticalCount, int HighCount, int MediumCount, int LowCount, int TotalUsers, int TotalTeams, int TotalOrganizations);
public record IncidentTrendDto(DateTime Date, int Count);

// Audit Log DTOs
public record AuditLogDto(int Id, string Action, string EntityType, int EntityId, string? OldValue, string? NewValue, int UserId, string UserName, DateTime CreatedAt);

// Pagination
public record PagedResult<T>(IEnumerable<T> Items, int TotalCount, int Page, int PageSize, int TotalPages);

// Generic API Response
public record ApiResponse(bool Success, string? Message = null, object? Data = null);
namespace OpsFlow.DTOs;

public record IncidentDto(Guid Id, string Title, string Description, string Status, string Priority, Guid OrganizationId, UserSummaryDto CreatedBy, UserSummaryDto? AssignedTo, TeamSummaryDto? Team, DateTime CreatedAt, DateTime? UpdatedAt, DateTime? ResolvedAt, DateTime? ClosedAt, int CommentCount);
public record IncidentListDto(Guid Id, string Title, string Status, string Priority, UserSummaryDto CreatedBy, UserSummaryDto? AssignedTo, DateTime CreatedAt, int CommentCount);
public record UserSummaryDto(Guid Id, string Email, string FullName, string Role);
public record TeamSummaryDto(Guid Id, string Name, int MemberCount);
public record CreateIncidentRequest(string Title, string Description, string Priority, Guid? AssignedToUserId, Guid? TeamId);
public record UpdateIncidentRequest(string? Title, string? Description, string? Status, string? Priority, Guid? AssignedToUserId, Guid? TeamId);
public record CreateCommentRequest(string Content);
public record CommentDto(Guid Id, string Content, Guid IncidentId, UserSummaryDto User, DateTime CreatedAt, DateTime? UpdatedAt);
public record TeamDto(Guid Id, string Name, string Description, Guid OrganizationId, List<UserSummaryDto> Members, DateTime CreatedAt);
public record CreateTeamRequest(string Name, string Description);
public record DashboardStatsDto(int TotalIncidents, int NewIncidents, int InProgressIncidents, int ResolvedIncidents, int ClosedIncidents, int CriticalIncidents, int HighPriorityIncidents, int TeamCount, int UserCount);
public record UserDto(Guid Id, string Email, string FirstName, string LastName, string Role, Guid OrganizationId, string OrganizationName, Guid? TeamId, string? TeamName);
public record LoginRequest(string Email, string Password);
public record LoginResponse(string Token, UserDto User);
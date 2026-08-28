namespace OpsFlow.Api.Models;

public enum UserRole
{
    User = 0,
    Operator = 1,
    Manager = 2,
    Admin = 3
}

public enum IncidentStatus
{
    Open = 0,
    InProgress = 1,
    Resolved = 2,
    Closed = 3,
    Cancelled = 4
}

public enum IncidentPriority
{
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3
}

public enum NotificationType
{
    Assigned = 0,
    StatusChanged = 1,
    Comment = 2,
    Mention = 3
}

public enum TimelineEntryType
{
    Comment = 0,
    Audit = 1,
    Status = 2,
    Attachment = 3
}
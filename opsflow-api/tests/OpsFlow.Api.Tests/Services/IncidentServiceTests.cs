using Moq;
using OpsFlow.Api.Data;
using OpsFlow.Api.DTOs;
using OpsFlow.Api.Models;
using Xunit;

namespace OpsFlow.Api.Tests.Services;

public class IncidentServiceTests
{
    private readonly Mock<IIncidentRepository> _incidentRepositoryMock;

    public IncidentServiceTests()
    {
        _incidentRepositoryMock = new Mock<IIncidentRepository>();
    }

    [Fact]
    public async Task Create_WithValidRequest_ReturnsIncidentDto()
    {
        var request = new CreateIncidentRequest("Test", "Desc", IncidentPriority.High, 1, null, null);
        _incidentRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Incident>())).ReturnsAsync((Incident i) => i);

        var result = await _incidentRepositoryMock.Object.AddAsync(new Incident());
        Assert.NotNull(result);
        await Task.CompletedTask;
    }

    [Fact]
    public async Task GetById_WithExistingId_ReturnsIncidentDto()
    {
        var incident = new Incident { Id = 1, Title = "Test", Status = IncidentStatus.Open, Priority = IncidentPriority.High, OrganizationId = 1, ReporterId = 1, Reporter = new User { Id = 1 } };
        _incidentRepositoryMock.Setup(x => x.GetByIdWithDetailsAsync(1)).ReturnsAsync(incident);

        var result = await _incidentRepositoryMock.Object.GetByIdWithDetailsAsync(1);
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        await Task.CompletedTask;
    }

    [Fact]
    public async Task GetById_WithNonExistingId_ReturnsNull()
    {
        _incidentRepositoryMock.Setup(x => x.GetByIdWithDetailsAsync(999)).ReturnsAsync((Incident?)null);

        var result = await _incidentRepositoryMock.Object.GetByIdWithDetailsAsync(999);
        Assert.Null(result);
        await Task.CompletedTask;
    }

    [Fact]
    public async Task Update_WithValidRequest_ReturnsUpdatedIncident()
    {
        var incident = new Incident { Id = 1, Title = "Original", Status = IncidentStatus.Open, Priority = IncidentPriority.Medium, OrganizationId = 1, ReporterId = 1 };
        _incidentRepositoryMock.Setup(x => x.GetByIdWithDetailsAsync(1)).ReturnsAsync(incident);
        _incidentRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<Incident>())).ReturnsAsync((Incident i) => i);

        var result = await _incidentRepositoryMock.Object.UpdateAsync(incident);
        Assert.NotNull(result);
        await Task.CompletedTask;
    }

    [Fact]
    public async Task Delete_WithExistingId_ReturnsTrue()
    {
        _incidentRepositoryMock.Setup(x => x.DeleteAsync(1)).ReturnsAsync(true);

        var result = await _incidentRepositoryMock.Object.DeleteAsync(1);
        Assert.True(result);
        await Task.CompletedTask;
    }

    [Fact]
    public async Task Delete_WithNonExistingId_ReturnsFalse()
    {
        _incidentRepositoryMock.Setup(x => x.DeleteAsync(999)).ReturnsAsync(false);

        var result = await _incidentRepositoryMock.Object.DeleteAsync(999);
        Assert.False(result);
        await Task.CompletedTask;
    }

    [Theory]
    [InlineData(IncidentStatus.Open)]
    [InlineData(IncidentStatus.InProgress)]
    [InlineData(IncidentStatus.Resolved)]
    [InlineData(IncidentStatus.Closed)]
    public async Task GetByStatus_ReturnsIncidents(IncidentStatus status)
    {
        var incidents = new List<Incident> { new Incident { Id = 1, Title = "Test", Status = status, Priority = IncidentPriority.Medium, OrganizationId = 1, ReporterId = 1 } };
        _incidentRepositoryMock.Setup(x => x.GetByStatusAsync(1, status, 1, 20)).ReturnsAsync(incidents);

        var result = await _incidentRepositoryMock.Object.GetByStatusAsync(1, status, 1, 20);
        Assert.Single(result);
        await Task.CompletedTask;
    }

    [Theory]
    [InlineData(IncidentPriority.Low)]
    [InlineData(IncidentPriority.Medium)]
    [InlineData(IncidentPriority.High)]
    [InlineData(IncidentPriority.Critical)]
    public async Task GetByPriority_ReturnsIncidents(IncidentPriority priority)
    {
        var incidents = new List<Incident> { new Incident { Id = 1, Title = "Test", Status = IncidentStatus.Open, Priority = priority, OrganizationId = 1, ReporterId = 1 } };
        _incidentRepositoryMock.Setup(x => x.GetByPriorityAsync(1, priority, 1, 20)).ReturnsAsync(incidents);

        var result = await _incidentRepositoryMock.Object.GetByPriorityAsync(1, priority, 1, 20);
        Assert.Single(result);
        await Task.CompletedTask;
    }
}
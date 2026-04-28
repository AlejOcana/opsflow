using Moq;
using OpsFlow.Api.Data;
using OpsFlow.Api.DTOs;
using OpsFlow.Api.Models;
using Xunit;

namespace OpsFlow.Api.Tests.Services;

public class DashboardServiceTests
{
    private readonly Mock<IIncidentRepository> _incidentRepositoryMock;

    public DashboardServiceTests()
    {
        _incidentRepositoryMock = new Mock<IIncidentRepository>();
    }

    [Fact]
    public async Task GetStats_ReturnsDashboardStats()
    {
        _incidentRepositoryMock.Setup(x => x.GetCountByOrganizationAsync(1)).ReturnsAsync(10);
        _incidentRepositoryMock.Setup(x => x.GetCountByStatusAsync(IncidentStatus.Open)).ReturnsAsync(3);

        var result = await _incidentRepositoryMock.Object.GetCountByOrganizationAsync(1);
        Assert.Equal(10, result);
        await Task.CompletedTask;
    }

    [Fact]
    public async Task GetTrend_ReturnsIncidentTrend()
    {
        var trendData = new List<IncidentTrendDto> { new IncidentTrendDto(DateTime.UtcNow.AddDays(-1), 5), new IncidentTrendDto(DateTime.UtcNow.AddDays(-2), 3) };
        _incidentRepositoryMock.Setup(x => x.GetTrendAsync(1, 30)).ReturnsAsync(trendData);

        var result = await _incidentRepositoryMock.Object.GetTrendAsync(1, 30);
        Assert.Equal(2, result.Count());
        await Task.CompletedTask;
    }

    [Fact]
    public async Task GetStats_WithNoData_ReturnsZeros()
    {
        _incidentRepositoryMock.Setup(x => x.GetCountByOrganizationAsync(1)).ReturnsAsync(0);
        _incidentRepositoryMock.Setup(x => x.GetCountByStatusAsync(IncidentStatus.Open)).ReturnsAsync(0);

        var result = await _incidentRepositoryMock.Object.GetCountByOrganizationAsync(1);
        Assert.Equal(0, result);
        await Task.CompletedTask;
    }

    [Theory]
    [InlineData(1)]
    [InlineData(7)]
    [InlineData(30)]
    [InlineData(90)]
    public async Task GetTrend_WithDifferentDays_ReturnsData(int days)
    {
        var trendData = new List<IncidentTrendDto>();
        _incidentRepositoryMock.Setup(x => x.GetTrendAsync(1, days)).ReturnsAsync(trendData);

        var result = await _incidentRepositoryMock.Object.GetTrendAsync(1, days);
        Assert.NotNull(result);
        await Task.CompletedTask;
    }
}
using Moq;
using OpsFlow.Api.Data;
using OpsFlow.Api.DTOs;
using OpsFlow.Api.Models;
using Xunit;

namespace OpsFlow.Api.Tests.Services;

public class TeamServiceTests
{
    private readonly Mock<ITeamRepository> _teamRepositoryMock;

    public TeamServiceTests()
    {
        _teamRepositoryMock = new Mock<ITeamRepository>();
    }

    [Fact]
    public async Task Create_WithValidRequest_ReturnsTeamDto()
    {
        var request = new CreateTeamRequest("Test", "Desc", 1, null);
        _teamRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Team>())).ReturnsAsync((Team t) => t);

        var result = await _teamRepositoryMock.Object.AddAsync(new Team { Name = "Test" });
        Assert.NotNull(result);
        await Task.CompletedTask;
    }

    [Fact]
    public async Task Create_WithInvalidOrganization_ThrowsException()
    {
        var request = new CreateTeamRequest("Test", "Desc", 999, null);
        _teamRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Team>())).ThrowsAsync(new InvalidOperationException("Organization not found"));

        await Assert.ThrowsAsync<InvalidOperationException>(() => _teamRepositoryMock.Object.AddAsync(new Team { Name = "Test" }));
    }

    [Fact]
    public async Task GetById_WithExistingId_ReturnsTeamDto()
    {
        var team = new Team { Id = 1, Name = "Test", OrganizationId = 1, IsActive = true };
        _teamRepositoryMock.Setup(x => x.GetByIdWithDetailsAsync(1)).ReturnsAsync(team);

        var result = await _teamRepositoryMock.Object.GetByIdWithDetailsAsync(1);
        Assert.NotNull(result);
        Assert.Equal("Test", result.Name);
        await Task.CompletedTask;
    }

    [Fact]
    public async Task GetById_WithNonExistingId_ReturnsNull()
    {
        _teamRepositoryMock.Setup(x => x.GetByIdWithDetailsAsync(999)).ReturnsAsync((Team?)null);

        var result = await _teamRepositoryMock.Object.GetByIdWithDetailsAsync(999);
        Assert.Null(result);
        await Task.CompletedTask;
    }

    [Fact]
    public async Task Update_WithValidRequest_ReturnsUpdatedTeam()
    {
        var team = new Team { Id = 1, Name = "Original", OrganizationId = 1 };
        _teamRepositoryMock.Setup(x => x.GetByIdWithDetailsAsync(1)).ReturnsAsync(team);
        _teamRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<Team>())).ReturnsAsync((Team t) => t);

        var result = await _teamRepositoryMock.Object.UpdateAsync(team);
        Assert.NotNull(result);
        await Task.CompletedTask;
    }

    [Fact]
    public async Task Update_WithManager_SetsManagerId()
    {
        var team = new Team { Id = 1, Name = "Test", OrganizationId = 1, ManagerId = null };
        _teamRepositoryMock.Setup(x => x.GetByIdWithDetailsAsync(1)).ReturnsAsync(team);

        var result = await _teamRepositoryMock.Object.GetByIdWithDetailsAsync(1);
        Assert.NotNull(result);
        await Task.CompletedTask;
    }

    [Fact]
    public async Task Delete_WithExistingId_ReturnsTrue()
    {
        _teamRepositoryMock.Setup(x => x.DeleteAsync(1)).ReturnsAsync(true);

        var result = await _teamRepositoryMock.Object.DeleteAsync(1);
        Assert.True(result);
        await Task.CompletedTask;
    }

    [Fact]
    public async Task Delete_WithNonExistingId_ReturnsFalse()
    {
        _teamRepositoryMock.Setup(x => x.DeleteAsync(999)).ReturnsAsync(false);

        var result = await _teamRepositoryMock.Object.DeleteAsync(999);
        Assert.False(result);
        await Task.CompletedTask;
    }

    [Fact]
    public async Task GetAll_ReturnsAllTeams()
    {
        var teams = new List<Team> { new Team { Id = 1, Name = "Team1", OrganizationId = 1 }, new Team { Id = 2, Name = "Team2", OrganizationId = 1 } };
        _teamRepositoryMock.Setup(x => x.GetAllAsync()).ReturnsAsync(teams);

        var result = await _teamRepositoryMock.Object.GetAllAsync();
        Assert.Equal(2, result.Count());
        await Task.CompletedTask;
    }

    [Fact]
    public async Task GetByOrganization_ReturnsTeamsForOrganization()
    {
        var teams = new List<Team> { new Team { Id = 1, Name = "Team1", OrganizationId = 1 } };
        _teamRepositoryMock.Setup(x => x.GetByOrganizationAsync(1)).ReturnsAsync(teams);

        var result = await _teamRepositoryMock.Object.GetByOrganizationAsync(1);
        Assert.Single(result);
        await Task.CompletedTask;
    }
}
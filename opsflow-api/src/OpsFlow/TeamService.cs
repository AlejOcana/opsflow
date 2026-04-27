using OpsFlow.Domain.Entities;
using OpsFlow.Domain.Interfaces;
using OpsFlow.DTOs;

namespace OpsFlow.Services;

public interface ITeamService
{
    Task<IEnumerable<TeamDto>> GetAllAsync(Guid organizationId);
    Task<TeamDto?> GetByIdAsync(Guid id, Guid organizationId);
    Task<TeamDto> CreateAsync(string name, string description, Guid organizationId);
    Task<TeamDto?> UpdateAsync(Guid id, string name, string description, Guid organizationId);
    Task<bool> DeleteAsync(Guid id, Guid organizationId);
}

public class TeamService : ITeamService
{
    private readonly ITeamRepository _teamRepository;

    public TeamService(ITeamRepository teamRepository) { _teamRepository = teamRepository; }

    public async Task<IEnumerable<TeamDto>> GetAllAsync(Guid organizationId)
    {
        var teams = await _teamRepository.GetByOrganizationAsync(organizationId);
        return teams.Select(MapToDto);
    }

    public async Task<TeamDto?> GetByIdAsync(Guid id, Guid organizationId)
    {
        var team = await _teamRepository.GetByIdAsync(id);
        if (team == null || team.OrganizationId != organizationId) return null;
        return MapToDto(team);
    }

    public async Task<TeamDto> CreateAsync(string name, string description, Guid organizationId)
    {
        var team = new Team { Id = Guid.NewGuid(), Name = name, Description = description, OrganizationId = organizationId, CreatedAt = DateTime.UtcNow, IsActive = true };
        await _teamRepository.AddAsync(team);
        return MapToDto(team);
    }

    public async Task<TeamDto?> UpdateAsync(Guid id, string name, string description, Guid organizationId)
    {
        var team = await _teamRepository.GetByIdAsync(id);
        if (team == null || team.OrganizationId != organizationId) return null;
        team.Name = name;
        team.Description = description;
        await _teamRepository.UpdateAsync(team);
        return await GetByIdAsync(id, organizationId);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid organizationId)
    {
        var team = await _teamRepository.GetByIdAsync(id);
        if (team == null || team.OrganizationId != organizationId) return false;
        await _teamRepository.DeleteAsync(id);
        return true;
    }

    private static TeamDto MapToDto(Team team) => new(team.Id, team.Name, team.Description, team.OrganizationId, team.Members.Select(m => new UserSummaryDto(m.Id, m.Email, $"{m.FirstName} {m.LastName}", m.Role.ToString())).ToList(), team.CreatedAt);
}
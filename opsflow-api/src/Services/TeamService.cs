using OpsFlow.Api.Data;
using OpsFlow.Api.DTOs;
using OpsFlow.Api.Models;

namespace OpsFlow.Api.Services;

public interface ITeamService
{
    Task<TeamDto?> GetByIdAsync(int id);
    Task<IEnumerable<TeamDto>> GetAllAsync();
    Task<IEnumerable<TeamDto>> GetByOrganizationAsync(int organizationId);
    Task<TeamDto> CreateAsync(CreateTeamRequest request);
    Task<TeamDto?> UpdateAsync(int id, UpdateTeamRequest request);
    Task<bool> DeleteAsync(int id);
}

public class TeamService : ITeamService
{
    private readonly ITeamRepository _teamRepository;
    private readonly IUserRepository _userRepository;
    private readonly IOrganizationRepository _organizationRepository;

    public TeamService(
        ITeamRepository teamRepository,
        IUserRepository userRepository,
        IOrganizationRepository organizationRepository)
    {
        _teamRepository = teamRepository;
        _userRepository = userRepository;
        _organizationRepository = organizationRepository;
    }

    public async Task<TeamDto?> GetByIdAsync(int id)
    {
        var team = await _teamRepository.GetByIdWithDetailsAsync(id);
        return team == null ? null : MapToDto(team);
    }

    public async Task<IEnumerable<TeamDto>> GetAllAsync()
    {
        var teams = await _teamRepository.GetAllAsync();
        return teams.Select(MapToDto);
    }

    public async Task<IEnumerable<TeamDto>> GetByOrganizationAsync(int organizationId)
    {
        var teams = await _teamRepository.GetByOrganizationAsync(organizationId);
        return teams.Select(MapToDto);
    }

    public async Task<TeamDto> CreateAsync(CreateTeamRequest request)
    {
        if (!await _organizationRepository.ExistsAsync(request.OrganizationId))
            throw new InvalidOperationException("Organization not found");

        if (request.ManagerId.HasValue && !await _userRepository.ExistsAsync(request.ManagerId.Value))
            throw new InvalidOperationException("Manager not found");

        var team = new Team
        {
            Name = request.Name,
            Description = request.Description,
            OrganizationId = request.OrganizationId,
            ManagerId = request.ManagerId
        };

        var created = await _teamRepository.AddAsync(team);
        return MapToDto(created);
    }

    public async Task<TeamDto?> UpdateAsync(int id, UpdateTeamRequest request)
    {
        var team = await _teamRepository.GetByIdWithDetailsAsync(id);
        if (team == null) return null;

        if (!string.IsNullOrEmpty(request.Name))
            team.Name = request.Name;
        if (request.Description != null)
            team.Description = request.Description;
        if (request.ManagerId.HasValue)
        {
            if (!await _userRepository.ExistsAsync(request.ManagerId.Value))
                throw new InvalidOperationException("Manager not found");
            team.ManagerId = request.ManagerId;
        }
        if (request.IsActive.HasValue)
            team.IsActive = request.IsActive.Value;

        var updated = await _teamRepository.UpdateAsync(team);
        return MapToDto(updated);
    }

    public async Task<bool> DeleteAsync(int id)
        => await _teamRepository.DeleteAsync(id);

    private static TeamDto MapToDto(Team team)
    {
        var members = team.Members?.Select(m => new TeamMemberDto(
            m.Id,
            m.FullName,
            m.Email,
            m.Role.ToString()
        )) ?? Enumerable.Empty<TeamMemberDto>();

        return new TeamDto(
            team.Id,
            team.Name,
            team.Description,
            team.OrganizationId,
            team.ManagerId,
            team.Manager?.FullName,
            team.CreatedAt,
            team.IsActive,
            team.Members?.Count ?? 0,
            team.Incidents?.Count ?? 0,
            members
        );
    }
}
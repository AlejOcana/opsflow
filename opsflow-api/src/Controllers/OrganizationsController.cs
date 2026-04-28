using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpsFlow.Api.Data;
using OpsFlow.Api.DTOs;
using OpsFlow.Api.Models;

namespace OpsFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrganizationsController : ControllerBase
{
    private readonly IOrganizationRepository _organizationRepository;
    private readonly ITeamRepository _teamRepository;
    private readonly IUserRepository _userRepository;
    private readonly IIncidentRepository _incidentRepository;

    public OrganizationsController(
        IOrganizationRepository organizationRepository,
        ITeamRepository teamRepository,
        IUserRepository userRepository,
        IIncidentRepository incidentRepository)
    {
        _organizationRepository = organizationRepository;
        _teamRepository = teamRepository;
        _userRepository = userRepository;
        _incidentRepository = incidentRepository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrganizationDto>>> GetAll()
    {
        var organizations = await _organizationRepository.GetAllAsync();
        var dtos = new List<OrganizationDto>();
        foreach (var org in organizations)
        {
            var users = await _userRepository.GetByOrganizationAsync(org.Id);
            var teams = await _teamRepository.GetByOrganizationAsync(org.Id);
            var incidents = await _incidentRepository.GetByOrganizationAsync(org.Id, 1, 1);
            dtos.Add(new OrganizationDto(
                org.Id,
                org.Name,
                org.Description,
                org.ContactEmail,
                org.CreatedAt,
                org.IsActive,
                users.Count(),
                teams.Count(),
                incidents.Count()
            ));
        }
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrganizationDto>> GetById(int id)
    {
        var organization = await _organizationRepository.GetByIdWithDetailsAsync(id);
        if (organization == null)
            return NotFound();

        return new OrganizationDto(
            organization.Id,
            organization.Name,
            organization.Description,
            organization.ContactEmail,
            organization.CreatedAt,
            organization.IsActive,
            organization.Users?.Count ?? 0,
            organization.Teams?.Count ?? 0,
            organization.Incidents?.Count ?? 0
        );
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<OrganizationDto>> Create([FromBody] CreateOrganizationRequest request)
    {
        if (await _organizationRepository.ExistsByNameAsync(request.Name))
            return BadRequest(new { message = "Organization name already exists" });

        var organization = new Organization
        {
            Name = request.Name,
            Description = request.Description,
            ContactEmail = request.ContactEmail
        };

        var created = await _organizationRepository.AddAsync(organization);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, new OrganizationDto(
            created.Id,
            created.Name,
            created.Description,
            created.ContactEmail,
            created.CreatedAt,
            created.IsActive,
            0, 0, 0
        ));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<OrganizationDto>> Update(int id, [FromBody] UpdateOrganizationRequest request)
    {
        var organization = await _organizationRepository.GetByIdAsync(id);
        if (organization == null)
            return NotFound();

        if (!string.IsNullOrEmpty(request.Name))
            organization.Name = request.Name;
        if (!string.IsNullOrEmpty(request.Description))
            organization.Description = request.Description;
        if (request.ContactEmail != null)
            organization.ContactEmail = request.ContactEmail;
        if (request.IsActive.HasValue)
            organization.IsActive = request.IsActive.Value;

        var updated = await _organizationRepository.UpdateAsync(organization);
        return Ok(new OrganizationDto(
            updated.Id,
            updated.Name,
            updated.Description,
            updated.ContactEmail,
            updated.CreatedAt,
            updated.IsActive,
            0, 0, 0
        ));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> Delete(int id)
    {
        var result = await _organizationRepository.DeleteAsync(id);
        if (!result)
            return NotFound();
        return NoContent();
    }
}
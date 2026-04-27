using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpsFlow.Domain.Interfaces;
using OpsFlow.DTOs;
using OpsFlow.Services;

namespace OpsFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepository;

    public UsersController(IUserRepository userRepository) { _userRepository = userRepository; }

    private Guid GetOrganizationId() => Guid.Parse(User.Claims.First(c => c.Type == "organizationId").Value);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var orgId = GetOrganizationId();
        var users = await _userRepository.GetByOrganizationAsync(orgId);
        return Ok(users.Select(u => new UserDto(u.Id, u.Email, u.FirstName, u.LastName, u.Role.ToString(), u.OrganizationId, u.Organization?.Name ?? "", u.TeamId, u.Team?.Name)));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return NotFound();
        return Ok(new UserDto(user.Id, user.Email, user.FirstName, user.LastName, user.Role.ToString(), user.OrganizationId, user.Organization?.Name ?? "", user.TeamId, user.Team?.Name));
    }
}
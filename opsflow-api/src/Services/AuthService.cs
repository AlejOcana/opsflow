using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using OpsFlow.Api.Data;
using OpsFlow.Api.DTOs;
using OpsFlow.Api.Models;

namespace OpsFlow.Api.Services;

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<AuthResponse?> RegisterAsync(RegisterRequest request);
    Task<User?> GetCurrentUserAsync(int userId);
}

public class AuthService : IAuthService
{
    private readonly OpsFlowDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IUserRepository _userRepository;

    public AuthService(OpsFlowDbContext context, IConfiguration configuration, IUserRepository userRepository)
    {
        _context = context;
        _configuration = configuration;
        _userRepository = userRepository;
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        User? user = null;
        
        if (!string.IsNullOrEmpty(request.Username))
            user = await _userRepository.GetByUsernameAsync(request.Username);
        else if (!string.IsNullOrEmpty(request.Email))
            user = await _userRepository.GetByEmailAsync(request.Email);
        
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        var token = GenerateJwtToken(user);
        return new AuthResponse(token, user.Id, user.Username, user.Email, user.FullName, user.Role);
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request)
    {
        if (await _userRepository.ExistsByUsernameAsync(request.Username))
            throw new InvalidOperationException("Username already exists");

        if (await _userRepository.ExistsByEmailAsync(request.Email))
            throw new InvalidOperationException("Email already exists");

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = passwordHash,
            FullName = request.FullName,
            Role = UserRole.User,
            OrganizationId = request.OrganizationId ?? 1
        };

        await _userRepository.AddAsync(user);
        var token = GenerateJwtToken(user);
        return new AuthResponse(token, user.Id, user.Username, user.Email, user.FullName, user.Role);
    }

    public async Task<User?> GetCurrentUserAsync(int userId)
        => await _userRepository.GetByIdAsync(userId);

    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var expiry = DateTime.UtcNow.AddMinutes(int.Parse(_configuration["Jwt:ExpiryMinutes"]!));

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: expiry,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
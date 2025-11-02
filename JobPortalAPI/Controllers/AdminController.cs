using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobPortalAPI.Data;
using JobPortalAPI.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace JobPortalAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AdminController : ControllerBase
    {
        private readonly JobPortalContext _context;

        public AdminController(JobPortalContext context)
        {
            _context = context;
        }

        // GET: api/Admin/dashboard-stats
        [HttpGet("dashboard-stats")]
        public async Task<ActionResult<object>> GetDashboardStats()
        {
            // Check if user is admin
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole?.ToLower() != "admin")
            {
                return Forbid();
            }

            var stats = new
            {
                TotalUsers = await _context.Users.CountAsync(),
                TotalCandidates = await _context.Users.CountAsync(u => u.Role.ToLower() == "candidate" || u.Role.ToLower() == "student"),
                TotalRecruiters = await _context.Users.CountAsync(u => u.Role.ToLower() == "recruiter"),
                TotalAdmins = await _context.Users.CountAsync(u => u.Role.ToLower() == "admin"),
                TotalJobs = await _context.Jobs.CountAsync(),
                TotalApplications = await _context.Applications.CountAsync(),
                TotalCompanies = await _context.Companies.CountAsync(),
                TotalGrievances = await _context.Grievances.CountAsync(),
                PendingApplications = await _context.Applications.CountAsync(a => a.Status.ToLower() == "pending")
            };

            return Ok(stats);
        }

        // GET: api/Admin/users
        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            // Check if user is admin
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole?.ToLower() != "admin")
            {
                return Forbid();
            }

            var users = await _context.Users
                .Select(u => new
                {
                    u.UserId,
                    u.Username,
                    u.Email,
                    u.Role,
                    u.Status,
                    u.PhoneNumber,
                    u.CreatedAt,
                    u.UpdatedAt,
                    u.VerificationStatus,
                    u.FailedLoginAttempts,
                    u.IsLocked
                })
                .ToListAsync();

            return Ok(users);
        }

        // POST: api/Admin/users
        [HttpPost("users")]
        public async Task<ActionResult<User>> CreateUser([FromBody] CreateUserDto userDto)
        {
            // Check if user is admin
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole?.ToLower() != "admin")
            {
                return Forbid();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Check if email already exists
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == userDto.Email);
            if (existingUser != null)
            {
                return BadRequest(new { message = "Email already exists" });
            }

            var user = new User
            {
                Username = userDto.Username,
                Email = userDto.Email,
                Password = userDto.Password, // Will be hashed by AuthController on first login
                Role = userDto.Role,
                PhoneNumber = userDto.PhoneNumber,
                Status = userDto.Status ?? "Active",
                VerificationStatus = userDto.VerificationStatus ?? "Pending",
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Return user without password
            var result = new
            {
                user.UserId,
                user.Username,
                user.Email,
                user.Role,
                user.Status,
                user.PhoneNumber,
                user.CreatedAt,
                user.UpdatedAt,
                user.VerificationStatus
            };

            return CreatedAtAction(nameof(GetUser), new { id = user.UserId }, result);
        }

        // GET: api/Admin/users/{id}
        [HttpGet("users/{id}")]
        public async Task<ActionResult<object>> GetUser(int id)
        {
            // Check if user is admin
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole?.ToLower() != "admin")
            {
                return Forbid();
            }

            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            var result = new
            {
                user.UserId,
                user.Username,
                user.Email,
                user.Role,
                user.Status,
                user.PhoneNumber,
                user.CreatedAt,
                user.UpdatedAt,
                user.VerificationStatus,
                user.FailedLoginAttempts,
                user.IsLocked
            };

            return Ok(result);
        }

        // PUT: api/Admin/users/{id}
        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto userDto)
        {
            // Check if user is admin
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole?.ToLower() != "admin")
            {
                return Forbid();
            }

            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            // Update fields
            if (!string.IsNullOrEmpty(userDto.Username))
                user.Username = userDto.Username;
            if (!string.IsNullOrEmpty(userDto.Email))
                user.Email = userDto.Email;
            if (!string.IsNullOrEmpty(userDto.Role))
                user.Role = userDto.Role;
            if (!string.IsNullOrEmpty(userDto.Status))
                user.Status = userDto.Status;
            if (!string.IsNullOrEmpty(userDto.PhoneNumber))
                user.PhoneNumber = userDto.PhoneNumber;
            if (!string.IsNullOrEmpty(userDto.VerificationStatus))
                user.VerificationStatus = userDto.VerificationStatus;

            user.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Admin/users/{id}
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            // Check if user is admin
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole?.ToLower() != "admin")
            {
                return Forbid();
            }

            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Admin/activity-logs
        [HttpGet("activity-logs")]
        public async Task<ActionResult<IEnumerable<ActivityLog>>> GetActivityLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            // Check if user is admin
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole?.ToLower() != "admin")
            {
                return Forbid();
            }

            var logs = await _context.ActivityLogs
                .OrderByDescending(l => l.CreatedDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(logs);
        }

        // GET: api/Admin/grievances
        [HttpGet("grievances")]
        public async Task<ActionResult<IEnumerable<Grievance>>> GetGrievances()
        {
            // Check if user is admin
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole?.ToLower() != "admin")
            {
                return Forbid();
            }

            var grievances = await _context.Grievances
                .Include(g => g.Submitter)
                .OrderByDescending(g => g.CreatedDate)
                .ToListAsync();

            return Ok(grievances);
        }

        // PUT: api/Admin/grievances/{id}/status
        [HttpPut("grievances/{id}/status")]
        public async Task<IActionResult> UpdateGrievanceStatus(int id, [FromBody] UpdateGrievanceStatusDto dto)
        {
            // Check if user is admin
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole?.ToLower() != "admin")
            {
                return Forbid();
            }

            var grievance = await _context.Grievances.FindAsync(id);
            if (grievance == null)
            {
                return NotFound();
            }

            grievance.Status = dto.Status;

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    // DTOs for admin operations
    public class CreateUserDto
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? Status { get; set; }
        public string? VerificationStatus { get; set; }
    }

    public class UpdateUserDto
    {
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? Role { get; set; }
        public string? Status { get; set; }
        public string? PhoneNumber { get; set; }
        public string? VerificationStatus { get; set; }
    }

    public class UpdateGrievanceStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}

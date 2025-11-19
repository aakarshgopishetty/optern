using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobPortalAPI.Data;
using JobPortalAPI.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using BCrypt.Net;
using Newtonsoft.Json.Linq;
using System.IO;

namespace JobPortalAPI.Controllers
{
    /// <summary>
    /// Authentication and user management endpoints
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly JobPortalContext _context;

        public AuthController(JobPortalContext context)
        {
            _context = context;
        }

        public class LoginRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        /// <summary>
        /// Authenticates a user and returns a JWT token
        /// </summary>
        /// <param name="req">Login credentials containing email and password</param>
        /// <returns>JWT token and user information on successful login</returns>
        /// <response code="200">Login successful with user data and token</response>
        /// <response code="400">Invalid email or password</response>
        /// <response code="401">Unauthorized - invalid credentials</response>
        /// <response code="500">Internal server error</response>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            try
            {
                Console.WriteLine($"AuthController - Login attempt");
                Console.WriteLine($"Request path: {HttpContext.Request.Path}");
                Console.WriteLine($"Request method: {HttpContext.Request.Method}");

                // Get client IP and user agent for logging
                var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
                var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();

                if (req == null || string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
                {
                    Console.WriteLine("Login failed: Email or password missing");
                    return BadRequest(new { message = "Email and password are required" });
                }

                // Validate email format
                if (!System.Text.RegularExpressions.Regex.IsMatch(req.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                {
                    return BadRequest(new { message = "Invalid email format" });
                }

                Console.WriteLine($"Searching for user with email: {req.Email}");
                // Get all users with this email and prioritize by role
                var users = await _context.Users.Where(u => u.Email == req.Email).ToListAsync();
                Console.WriteLine($"Found {users.Count} users with email {req.Email}");

                // Prioritize admin users over recruiter users over candidate users (student and Candidate are treated as equivalent)
                var adminUsers = users.Where(u => u.Role != null && u.Role.Contains("Admin", StringComparison.OrdinalIgnoreCase)).ToList();
                var recruiterUsers = users.Where(u => u.Role != null && u.Role.Contains("Recruiter", StringComparison.OrdinalIgnoreCase)).ToList();
                // Combine student and Candidate users since they both map to 'candidate' in the frontend
                var candidateUsers = users.Where(u => u.Role != null &&
                    (u.Role.Contains("student", StringComparison.OrdinalIgnoreCase) ||
                     u.Role.Contains("Candidate", StringComparison.OrdinalIgnoreCase))).ToList();

                // Debug logging
                Console.WriteLine($"Role filtering debug:");
                foreach (var u in users)
                {
                    Console.WriteLine($"  User {u.Email}: Role='{u.Role}', IsAdmin={u.Role != null && u.Role.Contains("Admin", StringComparison.OrdinalIgnoreCase)}, IsRecruiter={u.Role != null && u.Role.Contains("Recruiter", StringComparison.OrdinalIgnoreCase)}, IsCandidate={u.Role != null && (u.Role.Contains("student", StringComparison.OrdinalIgnoreCase) || u.Role.Contains("Candidate", StringComparison.OrdinalIgnoreCase))}");
                }

                Console.WriteLine($"Admin users: {adminUsers.Count}, Recruiter users: {recruiterUsers.Count}, Candidate users (including students): {candidateUsers.Count}");

                User? user = null;
                if (adminUsers.Any())
                {
                    // Prioritize admin users with non-empty passwords
                    var validAdminUsers = adminUsers.Where(u => !string.IsNullOrEmpty(u.Password)).ToList();
                    if (validAdminUsers.Any())
                    {
                        user = validAdminUsers.First();
                        Console.WriteLine($"Selected admin user with valid password: ID={user.UserId}, Role={user.Role}");
                    }
                    else
                    {
                        user = adminUsers.First();
                        Console.WriteLine($"Selected admin user (no valid password found): ID={user.UserId}, Role={user.Role}");
                    }
                }
                else if (recruiterUsers.Any())
                {
                    // Prioritize recruiter users with non-empty passwords
                    var validRecruiterUsers = recruiterUsers.Where(u => !string.IsNullOrEmpty(u.Password)).ToList();
                    if (validRecruiterUsers.Any())
                    {
                        user = validRecruiterUsers.First();
                        Console.WriteLine($"Selected recruiter user with valid password: ID={user.UserId}, Role={user.Role}");
                    }
                    else
                    {
                        user = recruiterUsers.First();
                        Console.WriteLine($"Selected recruiter user (no valid password found): ID={user.UserId}, Role={user.Role}");
                    }
                }
                else if (candidateUsers.Any())
                {
                    // Prioritize candidate users (including students) with non-empty passwords
                    // If multiple candidates exist, prefer the most recently updated one
                    var validCandidateUsers = candidateUsers.Where(u => !string.IsNullOrEmpty(u.Password))
                        .OrderByDescending(u => u.UpdatedAt)
                        .ToList();
                    if (validCandidateUsers.Any())
                    {
                        user = validCandidateUsers.First();
                        Console.WriteLine($"Selected candidate user with valid password: ID={user.UserId}, Role={user.Role}");
                    }
                    else
                    {
                        user = candidateUsers.OrderByDescending(u => u.UpdatedAt).First();
                        Console.WriteLine($"Selected candidate user (no valid password found): ID={user.UserId}, Role={user.Role}");
                    }
                }

                if (user == null)
                {
                    Console.WriteLine($"Login failed: No user found with email {req.Email}");
                    // Log failed attempt for non-existent user
                    await LogLoginAttemptAsync(null, req.Email, false, clientIp, userAgent);
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                // Check if account is locked
                if (user.IsLocked)
                {
                    Console.WriteLine($"Login failed: Account locked for user {user.Email}");
                    await LogLoginAttemptAsync(user.UserId, req.Email, false, clientIp, userAgent);
                    var remainingTime = user.LockoutEnd!.Value - DateTime.Now;
                    return Unauthorized(new {
                        message = $"Account is locked due to too many failed login attempts. Try again in {Math.Ceiling(remainingTime.TotalMinutes)} minutes."
                    });
                }

                Console.WriteLine($"User found: {user.Email}, Role: {user.Role}, Password length: {user.Password?.Length ?? 0}");
                Console.WriteLine($"Password starts with: '{user.Password?.Substring(0, Math.Min(5, user.Password?.Length ?? 0))}'");

                // SECURE: Only allow BCrypt hashed passwords
                bool isPasswordValid = false;

                if (string.IsNullOrEmpty(user.Password))
                {
                    Console.WriteLine($"Login failed: No password set for user {user.Email}");
                    await LogLoginAttemptAsync(user.UserId, req.Email, false, clientIp, userAgent);
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                // Only verify BCrypt hashed passwords
                if (user.Password.StartsWith("$2"))
                {
                    try
                    {
                        isPasswordValid = BCrypt.Net.BCrypt.Verify(req.Password, user.Password);
                        Console.WriteLine($"BCrypt verification result: {isPasswordValid}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"BCrypt verification error: {ex.Message}");
                        isPasswordValid = false;
                    }
                }
                else
                {
                    // CRITICAL: Plain text passwords are not allowed
                    Console.WriteLine($"SECURITY ALERT: User {user.Email} has unhashed password - forcing password reset");
                    await LogLoginAttemptAsync(user.UserId, req.Email, false, clientIp, userAgent);
                    return Unauthorized(new {
                        message = "Password security update required. Please use forgot password to reset your password.",
                        requiresPasswordReset = true
                    });
                }

                if (!isPasswordValid)
                {
                    Console.WriteLine($"Login failed: Invalid password for email {req.Email}");
                    Console.WriteLine($"Provided password length: {req.Password.Length}");
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                Console.WriteLine($"Login successful for user: {user.Email} (ID: {user.UserId})");

                // Handle successful login (reset counters, log attempt)
                await HandleSuccessfulLoginAsync(user, clientIp, userAgent);

                // Generate JWT token
                var token = GenerateJwtToken(user);

                // Remove password before returning
                user.Password = string.Empty;

                // If user is a recruiter, ensure they have a recruiter profile
                Recruiter? recruiter = null;
                if (user.Role == "recruiter")
                {
                    recruiter = await _context.Recruiters.FirstOrDefaultAsync(r => r.Email == user.Email);
                    if (recruiter == null)
                    {
                        Company? company = null;

                        // First, check if this user already has a company created during registration
                        // Look for companies that might be associated with this user
                        // Since we don't have a direct user-company relationship, we'll look for
                        // companies created around the same time as the user registration
                        var userCreatedTime = user.CreatedAt;
                        var companiesCreatedAroundUserTime = await _context.Companies
                            .Where(c => c.CreatedDate >= userCreatedTime.AddMinutes(-5) &&
                                       c.CreatedDate <= userCreatedTime.AddMinutes(5))
                            .OrderByDescending(c => c.CreatedDate)
                            .ToListAsync();

                        // If we find companies created around the user registration time,
                        // assume the most recent one is the one created during registration
                        if (companiesCreatedAroundUserTime.Any())
                        {
                            company = companiesCreatedAroundUserTime.First();
                            Console.WriteLine($"Found existing company '{company.Name}' created during registration for user: {user.Email}");
                        }
                        else
                        {
                            // No company found from registration, create a default company
                            company = await _context.Companies.FirstOrDefaultAsync();
                            if (company == null)
                            {
                                // Get or create default industry
                                var industry = await _context.Set<IndustryLookup>().FirstOrDefaultAsync();
                                if (industry == null)
                                {
                                    industry = new IndustryLookup { IndustryName = "Technology" };
                                    _context.Set<IndustryLookup>().Add(industry);
                                    await _context.SaveChangesAsync();
                                }

                                company = new Company
                                {
                                    Name = "Default Company",
                                    Website = "https://example.com",
                                    Size = "1-10",
                                    Address = "123 Main St",
                                    Phone = "123-456-7890",
                                    CreatedDate = DateTime.Now,
                                    IndustryID = industry.IndustryID
                                };
                                _context.Companies.Add(company);
                                await _context.SaveChangesAsync();
                            }
                        }

                        // Create recruiter profile
                        recruiter = new Recruiter
                        {
                            FullName = user.Username,
                            Email = user.Email,
                            JobTitle = "Recruiter",
                            CreatedDate = DateTime.Now,
                            UpdatedDate = DateTime.Now,
                            CompanyID = company.CompanyID
                        };
                        _context.Recruiters.Add(recruiter);
                        await _context.SaveChangesAsync();
                        Console.WriteLine($"Created recruiter profile for user: {user.Email} with company: {company.Name}");
                    }
                }

                // Return in a clear structure that frontend can easily parse
                var response = new
                {
                    message = "Login successful",
                    user = user,
                    success = true,
                    userId = user.UserId,
                    email = user.Email,
                    role = user.Role,
                    token = token,
                    recruiterProfile = recruiter != null ? new {
                        recruiterId = recruiter.RecruiterID,
                        fullName = recruiter.FullName,
                        email = recruiter.Email
                    } : (object)null
                };

                Console.WriteLine($"Returning response: {System.Text.Json.JsonSerializer.Serialize(response)}");
                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Login error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "An internal server error occurred. Please try again later." });
            }
        }

        [HttpGet("test")]
        public IActionResult Test()
        {
            return Ok(new { message = "AuthController is working" });
        }

        // REMOVED: Debug endpoints that expose sensitive information
        // [HttpGet("debug-users")] - Removed for security
        // [HttpPost("fix-specific-user")] - Removed for security

        [HttpGet("profile")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> GetUserProfile()
        {
            try
            {
                var emailClaim = User.FindFirst("Email");
                if (emailClaim == null)
                {
                    return Unauthorized(new { message = "Invalid authentication token" });
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == emailClaim.Value);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                var recruiter = await _context.Recruiters.FirstOrDefaultAsync(r => r.Email == emailClaim.Value);

                return Ok(new {
                    user = new {
                        email = user.Email,
                        role = user.Role,
                        userId = user.UserId
                    },
                    recruiterProfile = recruiter != null ? new {
                        recruiterId = recruiter.RecruiterID,
                        fullName = recruiter.FullName,
                        email = recruiter.Email
                    } : null
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Get profile error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "An error occurred while fetching profile" });
            }
        }

        [HttpGet("active-sessions")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> GetActiveSessions()
        {
            try
            {
                var userIdClaim = User.FindFirst("UserId");
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int authenticatedUserId))
                {
                    return Unauthorized(new { message = "Invalid authentication token" });
                }

                // Get all active sessions for this user
                var activeSessions = await _context.UserSessions
                    .Where(s => s.UserId == authenticatedUserId && s.IsActive)
                    .OrderByDescending(s => s.LastActivity)
                    .ToListAsync();

                var sessions = activeSessions.Select((session, index) => new {
                    sessionId = session.SessionId.ToString(),
                    deviceName = session.DeviceName,
                    location = session.Location,
                    ipAddress = session.IpAddress,
                    lastActive = session.LastActivity,
                    isCurrent = index == 0, // Mark first session as current
                    userAgent = session.UserAgent.Length > 100 ?
                        session.UserAgent.Substring(0, 100) + "..." : session.UserAgent
                }).ToList();

                return Ok(new {
                    sessions = sessions,
                    totalSessions = sessions.Count,
                    currentSessionCount = sessions.Count(s => s.isCurrent)
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Get active sessions error: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while fetching active sessions" });
            }
        }

        [HttpPost("revoke-session/{sessionId}")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> RevokeSession(string sessionId)
        {
            try
            {
                var userIdClaim = User.FindFirst("UserId");
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int authenticatedUserId))
                {
                    return Unauthorized(new { message = "Invalid authentication token" });
                }

                // In a real application, you would:
                // 1. Find the session in the database
                // 2. Mark it as revoked/invalid
                // 3. Return success

                // For demo purposes, just return success
                return Ok(new { message = "Session revoked successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Revoke session error: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while revoking the session" });
            }
        }

        [HttpPost("revoke-all-sessions")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> RevokeAllSessions()
        {
            try
            {
                var userIdClaim = User.FindFirst("UserId");
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int authenticatedUserId))
                {
                    return Unauthorized(new { message = "Invalid authentication token" });
                }

                // In a real application, you would:
                // 1. Find all sessions for this user except current
                // 2. Mark them as revoked/invalid
                // 3. Return success

                // For demo purposes, just return success
                return Ok(new { message = "All other sessions revoked successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Revoke all sessions error: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while revoking sessions" });
            }
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var users = await _context.Users.ToListAsync();
                Console.WriteLine($"Found {users.Count} users in database");
                foreach (var user in users)
                {
                    Console.WriteLine($"User: {user.Email} (ID: {user.UserId}, Role: {user.Role})");
                }

                // Remove passwords before returning
                foreach (var user in users)
                {
                    user.Password = string.Empty;
                }

                return Ok(new { users = users, count = users.Count });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting users: {ex.Message}");
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        public class ChangePasswordRequest
        {
            public string CurrentPassword { get; set; } = string.Empty;
            public string NewPassword { get; set; } = string.Empty;
            public int UserId { get; set; }
        }

        public class FixUserRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        public class ForgotPasswordRequest
        {
            public string Email { get; set; } = string.Empty;
        }

        public class ResetPasswordRequest
        {
            public string Token { get; set; } = string.Empty;
            public string NewPassword { get; set; } = string.Empty;
        }

        [HttpPost("change-password")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
        {
            try
            {
                Console.WriteLine("Change password attempt");

                // Get user ID from JWT token claims
                var userIdClaim = User.FindFirst("UserId");
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int authenticatedUserId))
                {
                    Console.WriteLine("Change password failed: Invalid or missing user ID in token");
                    return Unauthorized(new { message = "Invalid authentication token" });
                }

                if (req == null || string.IsNullOrWhiteSpace(req.CurrentPassword) || string.IsNullOrWhiteSpace(req.NewPassword))
                {
                    Console.WriteLine("Change password failed: Current password or new password missing");
                    return BadRequest(new { message = "Current password and new password are required" });
                }

                var user = await _context.Users.FindAsync(authenticatedUserId);
                if (user == null)
                {
                    Console.WriteLine($"Change password failed: User not found with ID {authenticatedUserId}");
                    return NotFound(new { message = "User not found" });
                }

                // Verify current password using BCrypt
                if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.Password))
                {
                    Console.WriteLine("Change password failed: Current password incorrect");
                    return BadRequest(new { message = "Current password is incorrect" });
                }

                // Hash the new password before saving
                user.Password = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
                await _context.SaveChangesAsync();

                Console.WriteLine($"Password changed successfully for user: {user.Email}");

                return Ok(new { message = "Password changed successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Change password error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "An internal server error occurred. Please try again later." });
            }
        }

        private string ParseDeviceName(string userAgent)
        {
            if (string.IsNullOrEmpty(userAgent))
                return "Unknown Device";

            userAgent = userAgent.ToLower();

            if (userAgent.Contains("chrome") && userAgent.Contains("windows"))
                return "Chrome on Windows";
            else if (userAgent.Contains("firefox") && userAgent.Contains("windows"))
                return "Firefox on Windows";
            else if (userAgent.Contains("safari") && userAgent.Contains("mac"))
                return "Safari on Mac";
            else if (userAgent.Contains("chrome") && userAgent.Contains("mac"))
                return "Chrome on Mac";
            else if (userAgent.Contains("safari") && userAgent.Contains("iphone"))
                return "Safari on iPhone";
            else if (userAgent.Contains("chrome") && userAgent.Contains("android"))
                return "Chrome on Android";
            else if (userAgent.Contains("edge") && userAgent.Contains("windows"))
                return "Edge on Windows";
            else if (userAgent.Contains("opera"))
                return "Opera Browser";
            else
                return "Web Browser";
        }

        private string GetLocationFromIP(string ipAddress)
        {
            // In a real application, you would use a geolocation service
            // For demo purposes, return mock locations based on IP
            if (ipAddress.StartsWith("192.168."))
                return "Mumbai, India";
            else if (ipAddress.StartsWith("10."))
                return "Delhi, India";
            else if (ipAddress == "Unknown")
                return "Unknown Location";
            else
                return "Mumbai, India"; // Default location
        }

        private string GenerateJwtToken(User user)
        {
            try
            {
                var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") ?? "YourSuperSecretKeyHere12345678901234567890";
                var accessTokenExpirationMinutes = int.Parse(Environment.GetEnvironmentVariable("JWT_ACCESS_TOKEN_EXPIRATION_MINUTES") ?? "15");

                var claims = new[]
                {
                    new Claim(JwtRegisteredClaimNames.Sub, user.Email),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                    new Claim("UserId", user.UserId.ToString()),
                    new Claim("Email", user.Email),
                    new Claim("Role", user.Role ?? "user")
                };

                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
                var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var token = new JwtSecurityToken(
                    issuer: "JobPortalAPI",
                    audience: "JobPortalFrontend",
                    claims: claims,
                    expires: DateTime.Now.AddMinutes(accessTokenExpirationMinutes),
                    signingCredentials: creds);

                return new JwtSecurityTokenHandler().WriteToken(token);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"JWT Token Generation Error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw; // Re-throw to be caught by the outer try-catch
            }
        }

        private string GenerateRefreshToken(int userId, string ipAddress, string userAgent)
        {
            try
            {
                var refreshTokenExpirationDays = int.Parse(Environment.GetEnvironmentVariable("JWT_REFRESH_TOKEN_EXPIRATION_DAYS") ?? "7");
                var token = Guid.NewGuid().ToString() + Guid.NewGuid().ToString(); // Generate a long random string

                var refreshToken = new RefreshToken
                {
                    UserId = userId,
                    Token = BCrypt.Net.BCrypt.HashPassword(token), // Hash the refresh token
                    ExpiresAt = DateTime.Now.AddDays(refreshTokenExpirationDays),
                    CreatedAt = DateTime.Now,
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    IsRevoked = false
                };

                _context.RefreshTokens.Add(refreshToken);
                _context.SaveChanges();

                return token; // Return the plain token to the client
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Refresh Token Generation Error: {ex.Message}");
                throw;
            }
        }

        private async Task LogLoginAttemptAsync(int? userId, string email, bool isSuccessful, string ipAddress, string userAgent)
        {
            try
            {
                var loginAttempt = new UserLoginAttempt
                {
                    UserId = userId ?? 0, // 0 for non-existent users
                    AttemptTime = DateTime.Now,
                    IsSuccessful = isSuccessful,
                    IpAddress = ipAddress,
                    UserAgent = userAgent
                };

                _context.UserLoginAttempts.Add(loginAttempt);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error logging login attempt: {ex.Message}");
                // Don't throw here to avoid breaking the login flow
            }
        }

        private async Task HandleFailedLoginAttemptAsync(User user, string ipAddress, string userAgent)
        {
            try
            {
                // Increment failed login attempts
                user.FailedLoginAttempts++;

                var maxAttempts = int.Parse(Environment.GetEnvironmentVariable("MAX_LOGIN_ATTEMPTS") ?? "5");
                var lockoutDurationMinutes = int.Parse(Environment.GetEnvironmentVariable("LOCKOUT_DURATION_MINUTES") ?? "30");

                // Check if account should be locked
                if (user.FailedLoginAttempts >= maxAttempts)
                {
                    user.LockoutEnd = DateTime.Now.AddMinutes(lockoutDurationMinutes);
                    user.FailedLoginAttempts = 0; // Reset counter after lockout
                    Console.WriteLine($"Account locked for user {user.Email} until {user.LockoutEnd}");
                }

                await _context.SaveChangesAsync();

                // Log the failed attempt
                await LogLoginAttemptAsync(user.UserId, user.Email, false, ipAddress, userAgent);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error handling failed login attempt: {ex.Message}");
                // Don't throw here to avoid breaking the login flow
            }
        }

        private async Task HandleSuccessfulLoginAsync(User user, string ipAddress, string userAgent)
        {
            try
            {
                // Reset failed login attempts on successful login
                user.FailedLoginAttempts = 0;
                user.LockoutEnd = null;
                user.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                // Log the successful attempt
                await LogLoginAttemptAsync(user.UserId, user.Email, true, ipAddress, userAgent);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error handling successful login: {ex.Message}");
                // Don't throw here to avoid breaking the login flow
            }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.Email))
                {
                    return BadRequest(new { message = "Email is required" });
                }

                // Validate email format
                if (!System.Text.RegularExpressions.Regex.IsMatch(request.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                {
                    return BadRequest(new { message = "Invalid email format" });
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                if (user == null)
                {
                    // Don't reveal if email exists or not for security
                    return Ok(new { message = "If the email exists, a password reset link has been sent." });
                }

                // Get client info for logging
                var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
                var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();

                // Generate secure reset token
                var resetToken = Guid.NewGuid().ToString() + Guid.NewGuid().ToString();
                var tokenExpirationHours = int.Parse(Environment.GetEnvironmentVariable("PASSWORD_RESET_TOKEN_EXPIRATION_HOURS") ?? "24");

                var passwordResetToken = new PasswordResetToken
                {
                    UserId = user.UserId,
                    Token = BCrypt.Net.BCrypt.HashPassword(resetToken),
                    ExpiresAt = DateTime.Now.AddHours(tokenExpirationHours),
                    CreatedAt = DateTime.Now,
                    IsUsed = false,
                    IpAddress = clientIp,
                    UserAgent = userAgent
                };

                _context.PasswordResetTokens.Add(passwordResetToken);
                await _context.SaveChangesAsync();

                // In a real application, send email here
                // For demo purposes, we'll log the token
                Console.WriteLine($"Password reset token for {user.Email}: {resetToken}");
                Console.WriteLine($"Token expires at: {passwordResetToken.ExpiresAt}");

                // TODO: Integrate with email service
                // await _emailService.SendPasswordResetEmail(user.Email, resetToken);

                return Ok(new
                {
                    message = "If the email exists, a password reset link has been sent.",
                    resetToken = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development" ? resetToken : null // Only expose in development
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Forgot password error: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while processing your request" });
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.NewPassword))
                {
                    return BadRequest(new { message = "Token and new password are required" });
                }

                // Validate password complexity
                string passwordError;
                if (!PasswordValidation.IsValidPassword(request.NewPassword, out passwordError))
                {
                    return BadRequest(new { message = passwordError });
                }

                // Find valid reset token
                var resetTokens = await _context.PasswordResetTokens
                    .Where(t => !t.IsUsed && t.ExpiresAt > DateTime.Now)
                    .ToListAsync();

                PasswordResetToken? validToken = null;
                foreach (var token in resetTokens)
                {
                    if (BCrypt.Net.BCrypt.Verify(request.Token, token.Token))
                    {
                        validToken = token;
                        break;
                    }
                }

                if (validToken == null)
                {
                    return BadRequest(new { message = "Invalid or expired reset token" });
                }

                // Get user
                var user = await _context.Users.FindAsync(validToken.UserId);
                if (user == null)
                {
                    return BadRequest(new { message = "User not found" });
                }

                // Update password
                user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                user.UpdatedAt = DateTime.Now;

                // Mark token as used
                validToken.IsUsed = true;

                // Reset account lockout if it was locked
                user.FailedLoginAttempts = 0;
                user.LockoutEnd = null;

                await _context.SaveChangesAsync();

                // Get client info for logging
                var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
                var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();

                Console.WriteLine($"Password reset successful for user: {user.Email} from IP: {clientIp}");

                return Ok(new { message = "Password has been reset successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Reset password error: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while resetting your password" });
            }
        }
    }
}

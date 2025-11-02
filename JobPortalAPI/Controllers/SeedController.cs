using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobPortalAPI.Data;
using JobPortalAPI.Models;

[Route("api/[controller]")]
[ApiController]
public class SeedController : ControllerBase
{
    private readonly JobPortalContext _context;

    public SeedController(JobPortalContext context) => _context = context;

    // PRODUCTION: Data reset endpoint - USE WITH EXTREME CAUTION
    // This will permanently delete ALL data from the database
    [HttpPost("reset")]
    public async Task<IActionResult> ResetData()
    {
        try
        {
            // SECURITY: Only allow in development or with special header
            var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
            var allowReset = HttpContext.Request.Headers.ContainsKey("X-Allow-Data-Reset");

            if (environment != "Development" && !allowReset)
            {
                return StatusCode(403, new {
                    message = "Data reset not allowed in production. " +
                             "Add header 'X-Allow-Data-Reset: true' to force reset.",
                    environment = environment
                });
            }

            Console.WriteLine("WARNING: Starting complete data reset...");

            // Clear all data in correct order (respecting foreign key constraints)
            // Delete dependent records first, then parent records

            // 1. Delete user sessions (depends on users)
            _context.UserSessions.RemoveRange(_context.UserSessions);
            await _context.SaveChangesAsync();
            Console.WriteLine("✓ Cleared user sessions");

            // 2. Delete password reset tokens (depends on users)
            _context.PasswordResetTokens.RemoveRange(_context.PasswordResetTokens);
            await _context.SaveChangesAsync();
            Console.WriteLine("✓ Cleared password reset tokens");

            // 3. Delete refresh tokens (depends on users)
            _context.RefreshTokens.RemoveRange(_context.RefreshTokens);
            await _context.SaveChangesAsync();
            Console.WriteLine("✓ Cleared refresh tokens");

            // 4. Delete login attempts (depends on users)
            _context.UserLoginAttempts.RemoveRange(_context.UserLoginAttempts);
            await _context.SaveChangesAsync();
            Console.WriteLine("✓ Cleared login attempts");

            // 5. Delete grievances (depends on users)
            _context.Grievances.RemoveRange(_context.Grievances);
            await _context.SaveChangesAsync();
            Console.WriteLine("✓ Cleared grievances");

            // 6. Delete applications (depends on jobs and candidates)
            _context.Applications.RemoveRange(_context.Applications);
            await _context.SaveChangesAsync();
            Console.WriteLine("✓ Cleared applications");

            // 7. Delete jobs (depends on recruiters and companies)
            _context.Jobs.RemoveRange(_context.Jobs);
            await _context.SaveChangesAsync();
            Console.WriteLine("✓ Cleared jobs");

            // 8. Delete recruiters (depends on users and companies)
            _context.Recruiters.RemoveRange(_context.Recruiters);
            await _context.SaveChangesAsync();
            Console.WriteLine("✓ Cleared recruiters");

            // 9. Delete candidate profiles (depends on users)
            _context.CandidateProfiles.RemoveRange(_context.CandidateProfiles);
            await _context.SaveChangesAsync();
            Console.WriteLine("✓ Cleared candidate profiles");

            // 10. Delete resumes (depends on users)
            _context.Resumes.RemoveRange(_context.Resumes);
            await _context.SaveChangesAsync();
            Console.WriteLine("✓ Cleared resumes");

            // 11. Delete companies (no dependencies now)
            _context.Companies.RemoveRange(_context.Companies);
            await _context.SaveChangesAsync();
            Console.WriteLine("✓ Cleared companies");

            // 12. Delete users (no dependencies now)
            _context.Users.RemoveRange(_context.Users);
            await _context.SaveChangesAsync();
            Console.WriteLine("✓ Cleared users");

            // 13. Delete lookup tables
            _context.IndustryLookups.RemoveRange(_context.IndustryLookups);
            await _context.SaveChangesAsync();
            Console.WriteLine("✓ Cleared industry lookups");

            // 14. Delete location type lookups
            _context.Set<LocationTypeLookup>().RemoveRange(_context.Set<LocationTypeLookup>());
            await _context.SaveChangesAsync();
            Console.WriteLine("✓ Cleared location type lookups");

            // 15. Delete job type lookups
            _context.Set<JobTypeLookup>().RemoveRange(_context.Set<JobTypeLookup>());
            await _context.SaveChangesAsync();
            Console.WriteLine("✓ Cleared job type lookups");

            // 16. Delete status lookups
            _context.Set<StatusLookup>().RemoveRange(_context.Set<StatusLookup>());
            await _context.SaveChangesAsync();
            Console.WriteLine("✓ Cleared status lookups");

            // 17. Delete interview status lookups
            _context.Set<InterviewStatusLookup>().RemoveRange(_context.Set<InterviewStatusLookup>());
            await _context.SaveChangesAsync();
            Console.WriteLine("✓ Cleared interview status lookups");

            Console.WriteLine("✅ Data reset completed successfully");
            return Ok(new {
                message = "All data has been permanently deleted from the database",
                warning = "This action cannot be undone",
                timestamp = DateTime.Now
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error resetting data: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new {
                message = "Error resetting data",
                error = ex.Message,
                timestamp = DateTime.Now
            });
        }
    }

    // PRODUCTION: Data seeding endpoint removed for security
    // Uncomment below for development only

    /*
    [HttpPost("data")]
    public async Task<IActionResult> SeedData()
    {
        // ... entire method commented out for production
    }
    */
}

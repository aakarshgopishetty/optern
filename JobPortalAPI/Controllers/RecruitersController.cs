using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobPortalAPI.Data;
using JobPortalAPI.Models;
using Microsoft.AspNetCore.Authorization;

[Route("api/[controller]")]
[ApiController]
public class RecruitersController : ControllerBase
{
    private readonly JobPortalContext _context;
    public RecruitersController(JobPortalContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Recruiter>>> GetAll() =>
        await _context.Recruiters.ToListAsync();

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<Recruiter>> GetMyProfile()
    {
        Console.WriteLine($"RecruitersController - GetMyProfile called");
        Console.WriteLine($"Request path: {HttpContext.Request.Path}");
        Console.WriteLine($"Request method: {HttpContext.Request.Method}");
        Console.WriteLine($"Request headers: {string.Join(", ", HttpContext.Request.Headers.Select(h => $"{h.Key}={h.Value}").ToList())}");
        
        var emailClaim = User.FindFirst("Email");
        if (emailClaim == null)
        {
            return Unauthorized(new { message = "Invalid authentication token" });
        }

        var recruiter = await _context.Recruiters.FirstOrDefaultAsync(r => r.Email == emailClaim.Value);
        if (recruiter == null)
        {
            // Auto-create profile for authenticated recruiters
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == emailClaim.Value && u.Role == "recruiter");
            if (user == null)
            {
                return Unauthorized(new { message = "User is not a recruiter" });
            }

            recruiter = new Recruiter
            {
                FullName = user.Username,
                Email = user.Email,
                JobTitle = "Recruiter",
                CreatedDate = DateTime.Now,
                UpdatedDate = DateTime.Now
            };

            _context.Recruiters.Add(recruiter);
            await _context.SaveChangesAsync();
        }

        return recruiter;
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<ActionResult<object>> GetProfile()
    {
        var emailClaim = User.FindFirst("Email");
        if (emailClaim == null)
        {
            return Unauthorized(new { message = "Invalid authentication token" });
        }

        var recruiter = await _context.Recruiters
            .Include(r => r.Company)
            .ThenInclude(c => c.Industry)
            .FirstOrDefaultAsync(r => r.Email == emailClaim.Value);

        if (recruiter == null)
        {
            return NotFound(new { message = "Recruiter profile not found" });
        }

        return Ok(new {
            recruiterID = recruiter.RecruiterID,
            fullName = recruiter.FullName,
            email = recruiter.Email,
            jobTitle = recruiter.JobTitle,
            phoneNumber = recruiter.PhoneNumber,
            bio = recruiter.Bio,
            createdDate = recruiter.CreatedDate,
            companyID = recruiter.CompanyID,
            company = recruiter.Company != null ? new {
                companyID = recruiter.Company.CompanyID,
                name = recruiter.Company.Name,
                website = recruiter.Company.Website,
                size = recruiter.Company.Size,
                address = recruiter.Company.Address,
                phone = recruiter.Company.Phone,
                founded = recruiter.Company.Founded,
                description = recruiter.Company.Description,
                industryID = recruiter.Company.IndustryID,
                industry = recruiter.Company.Industry != null ? new {
                    industryID = recruiter.Company.Industry.IndustryID,
                    industryName = recruiter.Company.Industry.IndustryName
                } : null
            } : null
        });
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateRecruiterProfileDto profileData)
    {
        Console.WriteLine($"UpdateProfile called with data: FullName={profileData.FullName}, JobTitle={profileData.JobTitle}, PhoneNumber={profileData.PhoneNumber}, Bio={profileData.Bio}");

        var emailClaim = User.FindFirst("Email");
        if (emailClaim == null)
        {
            return Unauthorized(new { message = "Invalid authentication token" });
        }

        var recruiter = await _context.Recruiters.FirstOrDefaultAsync(r => r.Email == emailClaim.Value);
        if (recruiter == null)
        {
            return NotFound(new { message = "Recruiter profile not found" });
        }

        Console.WriteLine($"Found recruiter: ID={recruiter.RecruiterID}, Current FullName={recruiter.FullName}, JobTitle={recruiter.JobTitle}");

        // Update recruiter fields based on the provided data
        if (!string.IsNullOrEmpty(profileData.FullName))
        {
            Console.WriteLine($"Updating FullName from '{recruiter.FullName}' to '{profileData.FullName}'");
            recruiter.FullName = profileData.FullName;
        }
        if (!string.IsNullOrEmpty(profileData.JobTitle))
        {
            Console.WriteLine($"Updating JobTitle from '{recruiter.JobTitle}' to '{profileData.JobTitle}'");
            recruiter.JobTitle = profileData.JobTitle;
        }
        if (!string.IsNullOrEmpty(profileData.PhoneNumber))
        {
            Console.WriteLine($"Updating PhoneNumber from '{recruiter.PhoneNumber}' to '{profileData.PhoneNumber}'");
            recruiter.PhoneNumber = profileData.PhoneNumber;
        }
        if (profileData.Bio != null)
        {
            Console.WriteLine($"Updating Bio from '{recruiter.Bio}' to '{profileData.Bio}'");
            recruiter.Bio = profileData.Bio;
        }

        recruiter.UpdatedDate = DateTime.Now;
        await _context.SaveChangesAsync();

        Console.WriteLine("Profile updated successfully");
        return Ok(new { message = "Profile updated successfully" });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Recruiter>> Get(int id)
    {
        var recruiter = await _context.Recruiters.FindAsync(id);
        return recruiter == null ? NotFound() : recruiter;
    }

    [HttpPost]
    public async Task<ActionResult<Recruiter>> Create(Recruiter recruiter)
    {
        _context.Recruiters.Add(recruiter);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = recruiter.RecruiterID }, recruiter);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Recruiter recruiter)
    {
        if (id != recruiter.RecruiterID) return BadRequest();
        _context.Entry(recruiter).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var recruiter = await _context.Recruiters.FindAsync(id);
        if (recruiter == null) return NotFound();
        _context.Recruiters.Remove(recruiter);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

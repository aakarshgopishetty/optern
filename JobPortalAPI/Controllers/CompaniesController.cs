using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobPortalAPI.Data;
using JobPortalAPI.Models;

[Route("api/[controller]")]
public class CompaniesController : ControllerBase
{
    private readonly JobPortalContext _context;
    public CompaniesController(JobPortalContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Company>>> GetAll() =>
        await _context.Companies.ToListAsync();

    [HttpGet("{id}")]
    public async Task<ActionResult<Company>> Get(int id)
    {
        var company = await _context.Companies.FindAsync(id);
        return company == null ? NotFound() : company;
    }

    [HttpPost]
    public async Task<ActionResult<Company>> Create(CompanyCreateDto companyDto)
    {
        // Ensure Industry exists
        var industry = await _context.IndustryLookups.FindAsync(companyDto.IndustryID);
        if (industry == null)
        {
            return BadRequest("Invalid IndustryID");
        }

        var company = new Company
        {
            Name = companyDto.Name,
            Website = companyDto.Website,
            Size = companyDto.Size,
            Address = companyDto.Address,
            Phone = companyDto.Phone,
            CreatedDate = companyDto.CreatedDate,
            IndustryID = companyDto.IndustryID
        };

        _context.Companies.Add(company);
        await _context.SaveChangesAsync();

        // Load the company with Industry for response
        var createdCompany = await _context.Companies
            .Include(c => c.Industry)
            .FirstOrDefaultAsync(c => c.CompanyID == company.CompanyID);

        return CreatedAtAction(nameof(Get), new { id = company.CompanyID }, createdCompany);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CompanyUpdateDto companyUpdate)
    {
        var company = await _context.Companies.FindAsync(id);
        if (company == null)
        {
            return NotFound();
        }

        Console.WriteLine($"UpdateCompany called for ID {id}");
        Console.WriteLine($"Received data: Name={companyUpdate.Name}, Website={companyUpdate.Website}, Address={companyUpdate.Address}, Size={companyUpdate.Size}, Founded={companyUpdate.Founded}, Description={companyUpdate.Description}");

        // Update company fields based on the provided data
        if (!string.IsNullOrEmpty(companyUpdate.Name))
        {
            Console.WriteLine($"Updating company name from '{company.Name}' to '{companyUpdate.Name}'");
            company.Name = companyUpdate.Name;
        }
        if (!string.IsNullOrEmpty(companyUpdate.Website))
        {
            Console.WriteLine($"Updating company website from '{company.Website}' to '{companyUpdate.Website}'");
            company.Website = companyUpdate.Website;
        }
        if (!string.IsNullOrEmpty(companyUpdate.Address))
        {
            Console.WriteLine($"Updating company address from '{company.Address}' to '{companyUpdate.Address}'");
            company.Address = companyUpdate.Address;
        }
        if (!string.IsNullOrEmpty(companyUpdate.Size))
        {
            Console.WriteLine($"Updating company size from '{company.Size}' to '{companyUpdate.Size}'");
            company.Size = companyUpdate.Size;
        }
        if (companyUpdate.Founded != null)
        {
            Console.WriteLine($"Updating company founded from '{company.Founded}' to '{companyUpdate.Founded}'");
            company.Founded = companyUpdate.Founded;
        }
        if (!string.IsNullOrEmpty(companyUpdate.Description))
        {
            Console.WriteLine($"Updating company description from '{company.Description}' to '{companyUpdate.Description}'");
            company.Description = companyUpdate.Description;
        }
        if (companyUpdate.IndustryID.HasValue)
        {
            Console.WriteLine($"Updating company industry from '{company.IndustryID}' to '{companyUpdate.IndustryID}'");
            company.IndustryID = companyUpdate.IndustryID.Value;
        }

        await _context.SaveChangesAsync();
        Console.WriteLine("Company updated successfully");
        return Ok(new { message = "Company updated successfully" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var company = await _context.Companies.FindAsync(id);
        if (company == null) return NotFound();
        _context.Companies.Remove(company);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

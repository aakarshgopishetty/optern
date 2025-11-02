using System.ComponentModel.DataAnnotations;

namespace JobPortalAPI.Models
{
    public class CompanyUpdateDto
    {
        public string? Name { get; set; }
        public string? Website { get; set; }
        public string? Address { get; set; }
        public string? Size { get; set; }
        public string? Founded { get; set; }
        public string? Description { get; set; }
        public int? IndustryID { get; set; }
    }
}

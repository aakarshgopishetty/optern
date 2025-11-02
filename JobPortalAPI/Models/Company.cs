using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace JobPortalAPI.Models
{
    public class Company
    {
        [Key]
        public int CompanyID { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        public string Website { get; set; } = string.Empty;
        public string Size { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Founded { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public int? IndustryID { get; set; }

        [ValidateNever]
        public IndustryLookup? Industry { get; set; }

        [ValidateNever]
        public ICollection<Recruiter> Recruiters { get; set; } = new List<Recruiter>();

        [ValidateNever]
        public ICollection<Job> Jobs { get; set; } = new List<Job>();
    }
}

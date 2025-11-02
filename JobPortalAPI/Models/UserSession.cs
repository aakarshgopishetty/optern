using System;
using System.ComponentModel.DataAnnotations;

namespace JobPortalAPI.Models
{
    public class UserSession
    {
        [Key]
        public int SessionId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [StringLength(500)]
        public string SessionToken { get; set; } = string.Empty;

        [Required]
        [StringLength(45)]
        public string IpAddress { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string UserAgent { get; set; } = string.Empty;

        [StringLength(100)]
        public string DeviceName { get; set; } = string.Empty;

        [StringLength(100)]
        public string Location { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime LastActivity { get; set; } = DateTime.Now;
        public DateTime ExpiresAt { get; set; }

        public bool IsActive => !IsExpired && !IsRevoked;
        public bool IsExpired => DateTime.Now > ExpiresAt;
        public bool IsRevoked { get; set; } = false;

        // Navigation property
        public virtual User? User { get; set; }
    }
}

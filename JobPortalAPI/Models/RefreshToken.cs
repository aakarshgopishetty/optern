using System.ComponentModel.DataAnnotations;

namespace JobPortalAPI.Models
{
    public class RefreshToken
    {
        [Key]
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsRevoked { get; set; }
        public string IpAddress { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;

        // Navigation property
        public User? User { get; set; }

        public bool IsExpired => DateTime.Now >= ExpiresAt;
        public bool IsActive => !IsRevoked && !IsExpired;
    }
}

using System.ComponentModel.DataAnnotations;

namespace JobPortalAPI.Models
{
    public class UserLoginAttempt
    {
        [Key]
        public int Id { get; set; }
        public int UserId { get; set; }
        public DateTime AttemptTime { get; set; }
        public bool IsSuccessful { get; set; }
        public string IpAddress { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;

        // Navigation property
        public User? User { get; set; }
    }
}

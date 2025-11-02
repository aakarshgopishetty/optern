using System.Text.RegularExpressions;

namespace JobPortalAPI.Models
{
    public static class PasswordValidation
    {
        public static bool IsValidPassword(string password, out string errorMessage)
        {
            errorMessage = string.Empty;

            if (string.IsNullOrWhiteSpace(password))
            {
                errorMessage = "Password is required";
                return false;
            }

            if (password.Length < 8)
            {
                errorMessage = "Password must be at least 8 characters long";
                return false;
            }

            if (!Regex.IsMatch(password, @"[A-Z]"))
            {
                errorMessage = "Password must contain at least one uppercase letter";
                return false;
            }

            if (!Regex.IsMatch(password, @"[a-z]"))
            {
                errorMessage = "Password must contain at least one lowercase letter";
                return false;
            }

            if (!Regex.IsMatch(password, @"[0-9]"))
            {
                errorMessage = "Password must contain at least one digit";
                return false;
            }

            if (!Regex.IsMatch(password, @"[^a-zA-Z0-9]"))
            {
                errorMessage = "Password must contain at least one special character";
                return false;
            }

            return true;
        }

        public static string GeneratePasswordRequirementsMessage()
        {
            return "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.";
        }
    }
}

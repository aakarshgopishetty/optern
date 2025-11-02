using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace JobPortalAPI.Middleware
{
    public class ValidationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ValidationMiddleware> _logger;

        public ValidationMiddleware(RequestDelegate next, ILogger<ValidationMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Validate request before processing
            if (!await ValidateRequestAsync(context))
            {
                return; // Response already set by validation
            }

            await _next(context);
        }

        private async Task<bool> ValidateRequestAsync(HttpContext context)
        {
            var path = context.Request.Path.Value?.ToLower();
            var method = context.Request.Method;

            // Skip validation for certain endpoints
            if (path?.Contains("/api/auth/login") == true ||
                path?.Contains("/api/auth/test") == true ||
                path?.Contains("/api/auth/debug-users") == true ||
                path?.StartsWith("/swagger") == true ||
                path?.StartsWith("/health") == true)
            {
                return true;
            }

            // Validate Content-Type for POST/PUT/PATCH requests
            if ((method == "POST" || method == "PUT" || method == "PATCH") &&
                !context.Request.ContentType?.Contains("application/json") == true)
            {
                _logger.LogWarning($"Invalid Content-Type for {method} request to {path}");
                context.Response.StatusCode = 400;
                await context.Response.WriteAsJsonAsync(new
                {
                    message = "Content-Type must be application/json",
                    error = "InvalidContentType"
                });
                return false;
            }

            // Validate request size
            if (context.Request.ContentLength > 1048576) // 1MB limit
            {
                _logger.LogWarning($"Request too large: {context.Request.ContentLength} bytes");
                context.Response.StatusCode = 413;
                await context.Response.WriteAsJsonAsync(new
                {
                    message = "Request body too large. Maximum size is 1MB.",
                    error = "RequestTooLarge"
                });
                return false;
            }

            // Validate query parameters
            if (!ValidateQueryParameters(context))
            {
                return false;
            }

            // Validate headers
            if (!ValidateHeaders(context))
            {
                return false;
            }

            return true;
        }

        private bool ValidateQueryParameters(HttpContext context)
        {
            foreach (var param in context.Request.Query)
            {
                // Check for potentially dangerous characters in query parameters
                if (ContainsSuspiciousCharacters(param.Value.ToString()))
                {
                    _logger.LogWarning($"Suspicious query parameter detected: {param.Key} = {param.Value}");
                    context.Response.StatusCode = 400;
                    context.Response.WriteAsJsonAsync(new
                    {
                        message = $"Invalid query parameter: {param.Key}",
                        error = "InvalidQueryParameter"
                    }).Wait();
                    return false;
                }
            }
            return true;
        }

        private bool ValidateHeaders(HttpContext context)
        {
            // Validate User-Agent header
            var userAgent = context.Request.Headers["User-Agent"].ToString();
            if (string.IsNullOrWhiteSpace(userAgent) || userAgent.Length > 500)
            {
                _logger.LogWarning("Invalid or missing User-Agent header");
                context.Response.StatusCode = 400;
                context.Response.WriteAsJsonAsync(new
                {
                    message = "Valid User-Agent header is required",
                    error = "InvalidUserAgent"
                }).Wait();
                return false;
            }

            // Validate common headers for suspicious content
            var suspiciousHeaders = new[] { "Referer", "Origin", "Host" };
            foreach (var headerName in suspiciousHeaders)
            {
                if (context.Request.Headers.ContainsKey(headerName))
                {
                    var headerValue = context.Request.Headers[headerName].ToString();
                    if (ContainsSuspiciousCharacters(headerValue))
                    {
                        _logger.LogWarning($"Suspicious header detected: {headerName} = {headerValue}");
                        context.Response.StatusCode = 400;
                        context.Response.WriteAsJsonAsync(new
                        {
                            message = $"Invalid header: {headerName}",
                            error = "InvalidHeader"
                        }).Wait();
                        return false;
                    }
                }
            }

            return true;
        }

        private bool ContainsSuspiciousCharacters(string input)
        {
            if (string.IsNullOrEmpty(input))
                return false;

            // Check for SQL injection patterns
            var sqlPatterns = new[]
            {
                @"(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)",
                @"(-{2,})", // SQL comments
                @"(/\*.*?\*/)", // SQL block comments
                @"(;|\|)", // SQL statement separators
            };

            foreach (var pattern in sqlPatterns)
            {
                if (Regex.IsMatch(input, pattern, RegexOptions.IgnoreCase))
                {
                    return true;
                }
            }

            // Check for XSS patterns (enhanced)
            var xssPatterns = new[]
            {
                @"<script[^>]*>.*?</script>",
                @"javascript:",
                @"vbscript:",
                @"data:text/html",
                @"onload\s*=",
                @"onerror\s*=",
                @"onclick\s*=",
                @"onmouseover\s*=",
                @"onmouseout\s*=",
                @"onkeydown\s*=",
                @"onkeyup\s*=",
                @"onkeypress\s*=",
                @"<iframe[^>]*>.*?</iframe>",
                @"<object[^>]*>.*?</object>",
                @"<embed[^>]*>.*?</embed>",
                @"<form[^>]*>.*?</form>",
                @"<input[^>]*>.*?</input>",
                @"expression\s*\(",
                @"vbscript:",
                @"mocha:",
                @"livescript:",
                @"<meta[^>]*>.*?</meta>",
                @"<link[^>]*>.*?</link>",
                @"<style[^>]*>.*?</style>",
            };

            foreach (var pattern in xssPatterns)
            {
                if (Regex.IsMatch(input, pattern, RegexOptions.IgnoreCase))
                {
                    return true;
                }
            }

            // Check for path traversal
            if (input.Contains("..") || input.Contains("\\") || input.Contains("../") || input.Contains("..\\"))
            {
                return true;
            }

            // Check for null bytes
            if (input.Contains("\0"))
            {
                return true;
            }

            return false;
        }
    }
}

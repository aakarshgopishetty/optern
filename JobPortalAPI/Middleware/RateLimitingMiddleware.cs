using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace JobPortalAPI.Middleware
{
    public class RateLimitingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IMemoryCache _cache;
        private readonly ILogger<RateLimitingMiddleware> _logger;

        // Rate limiting configuration
        private const int RequestsPerMinute = 60;
        private const int RequestsPerHour = 1000;
        private readonly TimeSpan _minuteWindow = TimeSpan.FromMinutes(1);
        private readonly TimeSpan _hourWindow = TimeSpan.FromHours(1);

        public RateLimitingMiddleware(
            RequestDelegate next,
            IMemoryCache cache,
            ILogger<RateLimitingMiddleware> logger)
        {
            _next = next;
            _cache = cache;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var clientIdentifier = GetClientIdentifier(context);
            var endpoint = context.Request.Path.Value?.ToLower();

            // Skip rate limiting for certain endpoints
            if (ShouldSkipRateLimiting(endpoint))
            {
                await _next(context);
                return;
            }

            // Check rate limits
            if (!IsWithinRateLimit(clientIdentifier, "minute"))
            {
                _logger.LogWarning($"Rate limit exceeded for client {clientIdentifier} (per minute)");
                context.Response.StatusCode = 429;
                context.Response.Headers["Retry-After"] = "60";
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "TooManyRequests",
                    message = "Too many requests. Please try again in 1 minute.",
                    retryAfter = 60
                });
                return;
            }

            if (!IsWithinRateLimit(clientIdentifier, "hour"))
            {
                _logger.LogWarning($"Rate limit exceeded for client {clientIdentifier} (per hour)");
                context.Response.StatusCode = 429;
                context.Response.Headers["Retry-After"] = "3600";
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "TooManyRequests",
                    message = "Too many requests. Please try again in 1 hour.",
                    retryAfter = 3600
                });
                return;
            }

            await _next(context);
        }

        private string GetClientIdentifier(HttpContext context)
        {
            // Try to get user ID if authenticated
            var userId = context.User?.FindFirst("UserId")?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                return $"user:{userId}";
            }

            // Fall back to IP address
            var ipAddress = context.Connection.RemoteIpAddress?.ToString();
            if (!string.IsNullOrEmpty(ipAddress))
            {
                return $"ip:{ipAddress}";
            }

            // Last resort: use a generic identifier
            return "unknown";
        }

        private bool ShouldSkipRateLimiting(string? endpoint)
        {
            if (string.IsNullOrEmpty(endpoint))
                return true;

            // Skip rate limiting for these endpoints
            var skipEndpoints = new[]
            {
                "/api/auth/test",
                "/api/auth/debug-users",
                "/health",
                "/swagger"
            };

            return skipEndpoints.Any(skip => endpoint.StartsWith(skip, StringComparison.OrdinalIgnoreCase));
        }

        private bool IsWithinRateLimit(string clientIdentifier, string windowType)
        {
            var cacheKey = $"{clientIdentifier}:{windowType}";
            var window = windowType == "minute" ? _minuteWindow : _hourWindow;
            var limit = windowType == "minute" ? RequestsPerMinute : RequestsPerHour;

            // Get or create request counter
            if (!_cache.TryGetValue(cacheKey, out RequestCounter counter))
            {
                counter = new RequestCounter
                {
                    Count = 0,
                    ResetTime = DateTime.Now.Add(window)
                };
            }

            // Reset counter if window has expired
            if (DateTime.Now >= counter.ResetTime)
            {
                counter = new RequestCounter
                {
                    Count = 0,
                    ResetTime = DateTime.Now.Add(window)
                };
            }

            // Check if limit exceeded
            if (counter.Count >= limit)
            {
                return false;
            }

            // Increment counter
            counter.Count++;

            // Update cache
            _cache.Set(cacheKey, counter, counter.ResetTime);

            return true;
        }

        private class RequestCounter
        {
            public int Count { get; set; }
            public DateTime ResetTime { get; set; }
        }
    }
}

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;

namespace JobPortalAPI.Middleware
{
    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestLoggingMiddleware> _logger;

        public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var stopwatch = Stopwatch.StartNew();
            var requestId = Guid.NewGuid().ToString();

            // Log incoming request
            LogRequest(context, requestId);

            // Capture response details
            var originalBodyStream = context.Response.Body;
            using var responseBody = new MemoryStream();
            context.Response.Body = responseBody;

            try
            {
                await _next(context);

                stopwatch.Stop();

                // Log response
                LogResponse(context, requestId, stopwatch.ElapsedMilliseconds);

                // Copy response back to original stream
                await responseBody.CopyToAsync(originalBodyStream);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();

                // Log error response
                _logger.LogError(ex,
                    "Request {RequestId} failed after {ElapsedMs}ms. Path: {Path}, Method: {Method}, Status: 500",
                    requestId,
                    stopwatch.ElapsedMilliseconds,
                    context.Request.Path,
                    context.Request.Method);

                throw; // Re-throw to let error handling middleware catch it
            }
        }

        private void LogRequest(HttpContext context, string requestId)
        {
            var userId = context.User?.FindFirst("UserId")?.Value ?? "Anonymous";
            var userAgent = context.Request.Headers["User-Agent"].ToString();
            var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
            var contentLength = context.Request.ContentLength ?? 0;

            // Log basic request information
            _logger.LogInformation(
                "Request {RequestId} started. Method: {Method}, Path: {Path}, User: {UserId}, IP: {IPAddress}, UserAgent: {UserAgent}, ContentLength: {ContentLength} bytes",
                requestId,
                context.Request.Method,
                context.Request.Path,
                userId,
                ipAddress,
                userAgent,
                contentLength);

            // Log query parameters (sanitized)
            if (context.Request.Query.Count > 0)
            {
                var queryParams = string.Join(", ", context.Request.Query.Select(q =>
                    $"{q.Key}={(ShouldLogQueryParam(q.Key) ? q.Value.ToString() : "[FILTERED]")}"));
                _logger.LogDebug("Request {RequestId} query parameters: {QueryParams}", requestId, queryParams);
            }

            // Log headers (sanitized)
            var importantHeaders = new[] { "Accept", "Content-Type", "Referer", "Origin" };
            foreach (var headerName in importantHeaders)
            {
                if (context.Request.Headers.ContainsKey(headerName))
                {
                    var headerValue = context.Request.Headers[headerName].ToString();
                    if (headerValue.Length > 200) // Truncate long headers
                    {
                        headerValue = headerValue.Substring(0, 200) + "...";
                    }
                    _logger.LogDebug("Request {RequestId} header {HeaderName}: {HeaderValue}",
                        requestId, headerName, headerValue);
                }
            }
        }

        private void LogResponse(HttpContext context, string requestId, long elapsedMs)
        {
            var statusCode = context.Response.StatusCode;
            var contentLength = context.Response.ContentLength ?? 0;

            // Determine log level based on status code
            var logLevel = statusCode >= 400 ? LogLevel.Warning :
                          statusCode >= 500 ? LogLevel.Error :
                          LogLevel.Information;

            _logger.Log(logLevel,
                "Request {RequestId} completed in {ElapsedMs}ms. Status: {StatusCode}, ContentLength: {ContentLength} bytes",
                requestId,
                elapsedMs,
                statusCode,
                contentLength);

            // Log security events
            if (statusCode == 401)
            {
                _logger.LogWarning("Request {RequestId} returned 401 Unauthorized. Path: {Path}",
                    requestId, context.Request.Path);
            }
            else if (statusCode == 403)
            {
                _logger.LogWarning("Request {RequestId} returned 403 Forbidden. Path: {Path}",
                    requestId, context.Request.Path);
            }
            else if (statusCode >= 500)
            {
                _logger.LogError("Request {RequestId} returned {StatusCode}. Path: {Path}",
                    requestId, statusCode, context.Request.Path);
            }
        }

        private bool ShouldLogQueryParam(string paramName)
        {
            // Don't log sensitive parameters
            var sensitiveParams = new[] { "password", "token", "key", "secret", "apikey" };
            return !sensitiveParams.Contains(paramName.ToLower());
        }
    }
}

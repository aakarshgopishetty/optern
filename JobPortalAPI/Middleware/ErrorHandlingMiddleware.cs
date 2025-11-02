using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;

namespace JobPortalAPI.Middleware
{
    public class ErrorHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ErrorHandlingMiddleware> _logger;

        public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var errorId = Guid.NewGuid().ToString();
            var timestamp = DateTime.UtcNow;

            // Log the error with detailed information
            _logger.LogError(exception,
                "Unhandled exception occurred. ErrorId: {ErrorId}, Path: {Path}, Method: {Method}, User: {User}, IP: {IP}",
                errorId,
                context.Request.Path,
                context.Request.Method,
                context.User?.Identity?.Name ?? "Anonymous",
                context.Connection.RemoteIpAddress?.ToString() ?? "Unknown");

            // Determine the appropriate status code and message
            var (statusCode, message, errorType) = GetErrorDetails(exception);

            // Don't expose internal error details in production
            var isDevelopment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";

            var errorResponse = new
            {
                errorId = errorId,
                timestamp = timestamp,
                message = message,
                path = context.Request.Path.ToString(),
                method = context.Request.Method,
                error = errorType,
                details = isDevelopment ? new
                {
                    exceptionType = exception.GetType().Name,
                    exceptionMessage = exception.Message,
                    stackTrace = exception.StackTrace
                } : null
            };

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = statusCode;

            var jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = isDevelopment
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(errorResponse, jsonOptions));
        }

        private (int statusCode, string message, string errorType) GetErrorDetails(Exception exception)
        {
            if (exception is ArgumentNullException)
                return (400, "Required parameter is missing", "BadRequest");
            if (exception is ArgumentException)
                return (400, "Invalid request parameters", "BadRequest");
            if (exception is InvalidOperationException)
                return (400, "Invalid operation", "BadRequest");
            if (exception is UnauthorizedAccessException)
                return (401, "Unauthorized access", "Unauthorized");
            if (exception is KeyNotFoundException)
                return (404, "Resource not found", "NotFound");
            if (exception is TimeoutException)
                return (408, "Request timeout", "Timeout");

            return (500, "An internal server error occurred", "InternalServerError");
        }
    }
}

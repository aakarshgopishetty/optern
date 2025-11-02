using JobPortalAPI.Data;
using JobPortalAPI.Middleware;
using JobPortalAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.IO;
using Microsoft.Data.Sqlite;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Load environment variables from .env file if it exists
var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
if (File.Exists(envPath))
{
    foreach (var line in File.ReadAllLines(envPath))
    {
        if (!string.IsNullOrWhiteSpace(line) && line.Contains('='))
        {
            var parts = line.Split('=', 2);
            if (parts.Length == 2)
            {
                Environment.SetEnvironmentVariable(parts[0], parts[1]);
            }
        }
    }
}

Console.WriteLine("Starting controller registration...");

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Configure JSON serialization for better frontend compatibility
        options.JsonSerializerOptions.PropertyNamingPolicy = null; // Keep PascalCase from models
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        // Disable automatic model state validation to handle it manually
        options.SuppressModelStateInvalidFilter = true;
    });

// Log the registered controllers
var controllers = AppDomain.CurrentDomain.GetAssemblies()
    .SelectMany(a => a.GetTypes())
    .Where(t => t.IsSubclassOf(typeof(Microsoft.AspNetCore.Mvc.ControllerBase)));

foreach (var controller in controllers)
{
    Console.WriteLine($"Found controller: {controller.Name}");
}

// Add SignalR services
builder.Services.AddSignalR();

builder.Services.AddDbContext<JobPortalContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// Add memory cache for rate limiting
builder.Services.AddMemoryCache();

// JWT Configuration - Read from environment variables
var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") ?? builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT_KEY environment variable is not set");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "JobPortalAPI";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "JobPortalFrontend";
var accessTokenExpirationMinutes = int.Parse(builder.Configuration["Jwt:AccessTokenExpirationMinutes"] ?? "15");
var refreshTokenExpirationDays = int.Parse(builder.Configuration["Jwt:RefreshTokenExpirationDays"] ?? "7");

// Add security headers
builder.Services.AddHsts(options =>
{
    options.Preload = true;
    options.IncludeSubDomains = true;
    options.MaxAge = TimeSpan.FromDays(365);
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.Zero // Remove default 5 minute clock skew
        };

        // Add custom event to handle test token (only in development)
        if (builder.Environment.IsDevelopment())
        {
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
                    if (authHeader == "Bearer test-token")
                    {
                        // Create a fake identity for test token
                        var claims = new[]
                        {
                            new System.Security.Claims.Claim("Email", "candidate@test.com"),
                            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Name, "Test Candidate"),
                            new System.Security.Claims.Claim("UserId", "1"),
                            new System.Security.Claims.Claim("Role", "Candidate")
                        };
                        var identity = new System.Security.Claims.ClaimsIdentity(claims, "TestToken");
                        context.Principal = new System.Security.Claims.ClaimsPrincipal(identity);
                        context.Success();
                    }
                    return Task.CompletedTask;
                }
            };
        }
    });

builder.Services.AddAuthorization();

// CORS: Allow specific origins for development
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: "AllowAll", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://localhost:3000", "http://localhost:4200", "https://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Initialize database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<JobPortalContext>();
    try
    {
        // Ensure database is created (for development - creates tables without migrations)
        await context.Database.EnsureCreatedAsync();
        Console.WriteLine("Database initialized successfully");

        // Create default admin user if it doesn't exist
        if (!context.Users.Any(u => u.Role == "Admin"))
        {
            var adminUser = new User
            {
                Username = "admin",
                Email = "admin@jobportal.com",
                Password = BCrypt.Net.BCrypt.HashPassword("Admin123!"), // Hash the password
                Role = "Admin",
                Status = "Active",
                VerificationStatus = "Verified",
                PhoneNumber = "",
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                FailedLoginAttempts = 0,
                LockoutEnd = null
            };

            context.Users.Add(adminUser);
            await context.SaveChangesAsync();
            Console.WriteLine("Default admin user created: admin@jobportal.com / Admin123!");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database initialization error: {ex.Message}");
        // For development, recreate the database if creation fails
        try
        {
            await context.Database.EnsureDeletedAsync();
            await context.Database.EnsureCreatedAsync();
            Console.WriteLine("Database recreated successfully");

            // Create default admin user
            if (!context.Users.Any(u => u.Role == "Admin"))
            {
                var adminUser = new User
                {
                    Username = "admin",
                    Email = "admin@jobportal.com",
                    Password = BCrypt.Net.BCrypt.HashPassword("Admin123!"), // Hash the password
                    Role = "Admin",
                    Status = "Active",
                    VerificationStatus = "Verified",
                    PhoneNumber = "",
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now,
                    FailedLoginAttempts = 0,
                    LockoutEnd = null
                };

                context.Users.Add(adminUser);
                await context.SaveChangesAsync();
                Console.WriteLine("Default admin user created: admin@jobportal.com / Admin123!");
            }
        }
        catch (Exception ex2)
        {
            Console.WriteLine($"Database recreation error: {ex2.Message}");
        }
    }
}

// Simplified middleware for debugging
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

// Use CORS policy - must come before UseRouting
app.UseCors("AllowAll");

// Enable static files so backend can optionally serve the frontend build from wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Map SignalR hub
app.MapHub<JobPortalAPI.Hubs.DashboardHub>("/dashboardHub");

// Fallback for SPA routes (serves index.html) - useful when hosting frontend from backend
// Only serve index.html for non-API routes to avoid interfering with API error responses
app.MapFallback(async context =>
{
    // Don't serve index.html for API routes that return errors
    var path = context.Request.Path.Value ?? "";
    if (path.StartsWith("/api/"))
    {
        // For API routes, return 404 to let the controller handle it
        context.Response.StatusCode = 404;
        return;
    }

    // For non-API routes, serve index.html
    context.Response.ContentType = "text/html";
    await context.Response.SendFileAsync(Path.Combine(app.Environment.WebRootPath, "index.html"));
});

app.Run();

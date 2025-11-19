# Job Portal API

A comprehensive REST API for the Job Portal application built with ASP.NET Core.

## Features

- **JWT Authentication** - Secure token-based authentication
- **Role-based Authorization** - Admin, Recruiter, and Candidate roles
- **Swagger Documentation** - Interactive API documentation
- **SignalR Support** - Real-time notifications
- **SQLite Database** - Lightweight database for development
- **Rate Limiting** - Protection against abuse
- **CORS Support** - Cross-origin resource sharing

## Getting Started

### Prerequisites

- .NET 9.0 SDK
- SQLite (included with .NET)

### Installation

1. Clone the repository
2. Navigate to the JobPortalAPI directory
3. Restore packages:
   ```bash
   dotnet restore
   ```

4. Set environment variables (optional):
   ```bash
   export JWT_KEY="YourSuperSecretKeyHere12345678901234567890"
   ```

5. Run the application:
   ```bash
   dotnet run
   ```

The API will be available at `http://localhost:5001`

## API Documentation

### Swagger UI

Access the interactive API documentation at:
```
http://localhost:5001/swagger
```

### Authentication

The API uses JWT Bearer tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer {your-jwt-token}
```

### Default Admin User

- **Email:** admin@jobportal.com
- **Password:** Admin123!

## API Endpoints

### Authentication
- `POST /api/Auth/login` - User login
- `GET /api/Auth/profile` - Get user profile
- `POST /api/Auth/change-password` - Change password
- `POST /api/Auth/forgot-password` - Request password reset
- `POST /api/Auth/reset-password` - Reset password

### Jobs
- `GET /api/Jobs` - Get all jobs
- `GET /api/Jobs/{id}` - Get job by ID
- `POST /api/Jobs` - Create new job
- `PUT /api/Jobs/{id}` - Update job
- `DELETE /api/Jobs/{id}` - Delete job

### Applications
- `GET /api/Applications` - Get applications
- `GET /api/Applications/by-candidate` - Get candidate applications
- `GET /api/Applications/by-recruiter` - Get recruiter applications
- `POST /api/Applications` - Create application
- `PUT /api/Applications/{id}` - Update application

### Users & Profiles
- `GET /api/Users` - Get all users
- `GET /api/CandidateProfiles` - Get candidate profiles
- `POST /api/CandidateProfiles` - Create candidate profile
- `PUT /api/CandidateProfiles/{id}` - Update candidate profile

### Dashboard
- `GET /api/Dashboard/candidate-stats` - Candidate dashboard stats
- `GET /api/Dashboard/recruiter-stats` - Recruiter dashboard stats
- `GET /api/Dashboard/top-jobs` - Top performing jobs

### Companies
- `GET /api/Companies` - Get all companies
- `GET /api/Companies/{id}` - Get company by ID
- `PUT /api/Companies/{id}` - Update company

### Grievances
- `GET /api/grievances` - Get all grievances
- `POST /api/grievances` - Create grievance
- `PUT /api/grievances/{id}` - Update grievance

## Development

### Database

The application uses SQLite for development. The database file `JobPortal.db` is created automatically when the application starts.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_KEY` | Generated | Secret key for JWT token signing |
| `JWT_ACCESS_TOKEN_EXPIRATION_MINUTES` | 15 | Access token expiration time |
| `JWT_REFRESH_TOKEN_EXPIRATION_DAYS` | 7 | Refresh token expiration time |
| `MAX_LOGIN_ATTEMPTS` | 5 | Maximum failed login attempts before lockout |
| `LOCKOUT_DURATION_MINUTES` | 30 | Account lockout duration |

### Testing the API

1. Start the API server
2. Open `http://localhost:5001/swagger` in your browser
3. Use the Swagger UI to test endpoints
4. For authenticated endpoints, first login to get a JWT token

### Sample Login Request

```json
{
  "email": "admin@jobportal.com",
  "password": "Admin123!"
}
```

## Deployment

### Production Environment Variables

Set these environment variables in your production environment:

```bash
JWT_KEY=your-production-jwt-key-here
ASPNETCORE_ENVIRONMENT=Production
```

### Database

For production, consider using SQL Server instead of SQLite. Update the connection string in `appsettings.json` or environment variables.

## Contributing

1. Follow the existing code style
2. Add XML documentation comments to new endpoints
3. Test your changes with Swagger UI
4. Update this README if you add new features

## License

This project is licensed under the MIT License.

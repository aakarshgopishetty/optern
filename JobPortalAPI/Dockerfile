# Use the official .NET 9.0 SDK image to build the application
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy the project file and restore dependencies
COPY ["db_apis.csproj", "./"]
RUN dotnet restore "./db_apis.csproj"

# Copy the rest of the source code
COPY . .

# Build the application
RUN dotnet build "db_apis.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "db_apis.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Use the official .NET 9.0 runtime image for the final stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Copy the published application
COPY --from=publish /app/publish .

# Create directory for SQLite database
RUN mkdir -p /app/data

# Set environment variables
ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production

# Expose port 80
EXPOSE 80

# Set the entry point
ENTRYPOINT ["dotnet", "db_apis.dll"]

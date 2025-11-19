// To configure for different environments:
//
// 1. DEVELOPMENT: Change apiBaseUrl to your dev API URL
// 2. PRODUCTION: Change apiBaseUrl to your production API URL
// 3. Or use environment variables when running/building
//
// Examples:
// - Development: 'http://localhost:5001'
// - Staging: 'https://api-staging.yourapp.com'
// - Production: 'https://api.yourapp.com'

export const environment = {
  production: true, // Angular automatically sets this to true in production builds
  apiBaseUrl: 'https://optern-prod-api.azurewebsites.net'
  //apiBaseUrl: 'https://localhost:5001' // ← Change this URL for your environment
};

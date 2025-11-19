param location string = 'East US'
param environmentName string = 'optern-prod'
param repositoryUrl string = 'https://github.com/aakarshgopishetty/optern'
param sqlAdministratorLogin string = 'opternadmin'
@secure()
param sqlAdministratorLoginPassword string = 'ChangeThisPassword123!'

var appServicePlanName = '${environmentName}-plan'
var webAppName = '${environmentName}-api'
var frontendAppName = '${environmentName}-frontend'
var sqlServerName = '${environmentName}-sql'
var databaseName = 'JobPortalDB'

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  properties: {
    reserved: false
  }
}

// Backend Web App
resource webApp 'Microsoft.Web/sites@2022-03-01' = {
  name: webAppName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOCKER|optern/optern-api:latest'
      alwaysOn: true
      cors: {
        allowedOrigins: [
          'https://${frontendAppName}.azurestaticapps.net'
        ]
      }
      appSettings: [
        {
          name: 'DOCKER_REGISTRY_SERVER_URL'
          value: 'https://index.docker.io'
        }
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
        {
          name: 'ASPNETCORE_ENVIRONMENT'
          value: 'Production'
        }
        {
          name: 'JWT_KEY'
          value: 'SecureProductionJWTKey256BitsMinimum32CharactersLong2024!'
        }
      ]
    }
  }
}

// Frontend Static Web App
resource staticWebApp 'Microsoft.Web/staticSites@2022-03-01' = {
  name: frontendAppName
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: repositoryUrl
    branch: 'main'
    buildProperties: {
      appLocation: '/frontend'
      apiLocation: ''
      outputLocation: '/dist'
      appBuildCommand: 'npm run build --prod'
      apiBuildCommand: ''
      skipAppBuild: false
    }
    templateProperties: {
      templateRepositoryUrl: ''
      isPrivate: false
    }
  }
}

// SQL Server (optional - for production database)
resource sqlServer 'Microsoft.Sql/servers@2022-05-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdministratorLogin
    administratorLoginPassword: sqlAdministratorLoginPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

// SQL Database (optional - for production database)
resource sqlDatabase 'Microsoft.Sql/servers/databases@2022-05-01-preview' = {
  parent: sqlServer
  name: databaseName
  location: location
  sku: {
    name: 'Basic'
    tier: 'Basic'
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 2147483648 // 2 GB
    zoneRedundant: false
  }
}

// Outputs
output webAppUrl string = webApp.properties.defaultHostName
output staticWebAppUrl string = staticWebApp.properties.defaultHostname
output sqlServerName string = sqlServer.name
output databaseName string = sqlDatabase.name

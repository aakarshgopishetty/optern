# Azure Deployment Guide for Optern

This guide provides step-by-step instructions for deploying the Optern job portal application to Microsoft Azure using your GitHub repository: `https://github.com/aakarshgopishetty/optern`

## 🏗️ Architecture Overview

The application consists of:
- **Frontend**: Angular SPA served via Azure Static Web Apps
- **Backend**: ASP.NET Core Web API running in Azure App Service with Docker containers
- **Database**: SQLite (file-based) or Azure SQL Database (recommended for production)

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Azure Account** with an active subscription
2. **Azure CLI** installed: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
3. **Docker** installed and running
4. **Docker Hub** account for container registry
5. **GitHub** repository access (your repo: https://github.com/aakarshgopishetty/optern)

## 🚀 Deployment Options

Choose the deployment method that works best for you:

### Option 1: Automated Script (Recommended)
**Best for:** One-time deployments, manual control

1. **Push your code to GitHub first:**
   ```bash
   git add .
   git commit -m "Add Azure deployment configuration"
   git push origin main
   ```

2. **Run the deployment script**
   ```bash
   ./deploy.sh
   ```

   The script will guide you through:
   - Azure login
   - Resource group creation
   - Infrastructure deployment
   - Docker image building and pushing
   - Application deployment

### Option 2: GitHub Actions CI/CD (Fully Automated)
**Best for:** Continuous deployment on every code change

1. **Set up GitHub Secrets** in your repository https://github.com/aakarshgopishetty/optern:
   - `AZURE_CREDENTIALS`: Azure service principal credentials (JSON)
   - `AZURE_SUBSCRIPTION_ID`: Your Azure subscription ID
   - `AZURE_RESOURCE_GROUP`: `optern-rg`
   - `AZURE_STATIC_WEB_APPS_API_TOKEN`: From Azure Static Web Apps
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub password

2. **Push to main branch** - deployment happens automatically!

## 🔧 Manual Deployment Steps

If you prefer manual deployment:

### Step 1: Set up Azure Resources

1. **Create a resource group**
   ```bash
   az group create --name optern-rg --location "East US"
   ```

2. **Deploy infrastructure using Bicep**
   ```bash
   az deployment group create \
     --resource-group optern-rg \
     --template-file azure-deploy.bicep \
     --parameters environmentName=optern-prod \
     --parameters repositoryUrl=https://github.com/aakarshgopishetty/optern
   ```

### Step 2: Build and Push Docker Images

1. **Login to Docker Hub**
   ```bash
   docker login
   ```

2. **Build and push API image**
   ```bash
   docker build -t optern/optern-api:latest ./JobPortalAPI
   docker push optern/optern-api:latest
   ```

3. **Build and push Frontend image**
   ```bash
   docker build -t optern/optern-frontend:latest ./frontend
   docker push optern/optern-frontend:latest
   ```

### Step 3: Deploy Applications

1. **Deploy API to Azure App Service**
   ```bash
   az webapp config container set \
     --name optern-prod-api \
     --resource-group optern-rg \
     --docker-custom-image-name optern/optern-api:latest
   ```

2. **Configure API environment variables**
   ```bash
   az webapp config appsettings set \
     --name optern-prod-api \
     --resource-group optern-rg \
     --setting ASPNETCORE_ENVIRONMENT=Production \
     --setting JWT_KEY=SecureProductionJWTKey256BitsMinimum32CharactersLong2024!
   ```

## 🔧 Configuration

### Environment Variables

The following environment variables are configured:

#### Backend (API)
- `ASPNETCORE_ENVIRONMENT`: Set to `Production`
- `JWT_KEY`: Secure JWT signing key (minimum 32 characters)
- `DATABASE_CONNECTION`: Database connection string

#### Frontend
- `apiBaseUrl`: Configured to point to `https://optern-prod-api.azurewebsites.net`

### CORS Configuration

CORS is automatically configured to allow the frontend domain.

## 🧪 Testing the Deployment

1. **Access the frontend URL** provided by Azure Static Web Apps
2. **Test API endpoints** using the Swagger UI at `https://optern-prod-api.azurewebsites.net/swagger`
3. **Verify database connectivity** by checking if user registration/login works

## 📊 Monitoring and Maintenance

### Application Insights
Set up Azure Application Insights for monitoring:
```bash
az monitor app-insights component create \
  --app optern-api-insights \
  --location "East US" \
  --resource-group optern-rg
```

### Logs
View application logs:
```bash
az webapp log download --name optern-prod-api --resource-group optern-rg
```

## 💰 Cost Estimation

Approximate monthly costs (Pay-as-you-go):

### Free Tier Available
- **Azure Static Web Apps**: 100 GB bandwidth, 0.5 GB storage - **FREE**
- **Azure App Service**: 1 B1 instance free for 12 months with eligible subscription

### Paid Components
- **App Service Plan (B1)**: ~$13/month (after free tier expires)
- **Azure SQL Database (Basic)**: ~$5/month (optional, using SQLite is free)

**Total estimated cost**: **$0-20/month** for first year, **$20-50/month** thereafter

## 🚨 Troubleshooting

### Common Issues

1. **Container deployment fails**
   - Check Docker image build logs
   - Verify Docker Hub credentials
   - Ensure Dockerfile is correct

2. **API returns 500 errors**
   - Check application logs in Azure portal
   - Verify environment variables
   - Test locally with Docker

3. **Frontend shows blank page**
   - Check browser console for errors
   - Verify API URL configuration
   - Check CORS settings

## 📞 Support

For deployment issues or questions:
- Check Azure status: https://status.azure.com
- Azure documentation: https://docs.microsoft.com/en-us/azure
- GitHub Issues: Report issues in the project repository

---

**Repository**: https://github.com/aakarshgopishetty/optern
**Note**: This deployment guide is configured specifically for your GitHub repository.

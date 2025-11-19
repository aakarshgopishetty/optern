#!/bin/bash

# Optern Azure Deployment Script
# This script helps deploy the Optern application to Azure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Optern Azure Deployment Script${NC}"
echo "================================="

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed. Please install it first: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli${NC}"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install it first.${NC}"
    exit 1
fi

# Login to Azure
echo -e "${YELLOW}🔐 Logging in to Azure...${NC}"
az login --use-device-code

# Set subscription
read -p "Enter your Azure subscription ID: " subscription_id
az account set --subscription $subscription_id

# Create resource group
read -p "Enter resource group name [optern-rg]: " resource_group
resource_group=${resource_group:-optern-rg}

read -p "Enter location [East US]: " location
location=${location:-"East US"}

echo -e "${BLUE}📦 Creating resource group: $resource_group${NC}"
az group create --name $resource_group --location "$location"

# Deploy infrastructure
echo -e "${BLUE}🏗️  Deploying Azure resources...${NC}"
az deployment group create \
  --resource-group $resource_group \
  --template-file azure-deploy.bicep \
  --parameters environmentName=optern-prod \
  --parameters repositoryUrl=https://github.com/aakarshgopishetty/optern

# Get deployment outputs
api_url=$(az deployment group show --resource-group $resource_group --name azure-deploy --query properties.outputs.webAppUrl.value -o tsv)
frontend_url=$(az deployment group show --resource-group $resource_group --name azure-deploy --query properties.outputs.staticWebAppUrl.value -o tsv)

echo -e "${GREEN}✅ Infrastructure deployed successfully!${NC}"
echo -e "${BLUE}🌐 API URL: https://$api_url${NC}"
echo -e "${BLUE}🌐 Frontend URL: https://$frontend_url${NC}"

# Build and push Docker images
echo -e "${YELLOW}🐳 Building and pushing Docker images...${NC}"

# Login to Docker Hub
read -p "Enter Docker Hub username: " docker_username
docker login -u $docker_username

# Build and push API image
echo "Building API image..."
docker build -t optern/optern-api:latest ./JobPortalAPI
docker push optern/optern-api:latest

# Build and push Frontend image
echo "Building Frontend image..."
docker build -t optern/optern-frontend:latest ./frontend
docker push optern/optern-frontend:latest

echo -e "${GREEN}✅ Docker images built and pushed!${NC}"

# Deploy to Azure Web Apps
echo -e "${YELLOW}🚀 Deploying to Azure Web Apps...${NC}"

# Deploy API
az webapp config container set \
  --name optern-prod-api \
  --resource-group $resource_group \
  --docker-custom-image-name optern/optern-api:latest \
  --docker-registry-server-url https://index.docker.io

# Configure API environment variables
az webapp config appsettings set \
  --name optern-prod-api \
  --resource-group $resource_group \
  --setting ASPNETCORE_ENVIRONMENT=Production \
  --setting JWT_KEY=SecureProductionJWTKey256BitsMinimum32CharactersLong2024!

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Update your DNS to point to the Azure Static Web App URL"
echo "2. Configure CORS settings if needed"
echo "3. Set up monitoring and logging"
echo "4. Configure backup strategies for the database"
echo ""
echo -e "${BLUE}🔗 URLs:${NC}"
echo -e "API: https://$api_url"
echo -e "Frontend: https://$frontend_url"

#!/bin/bash
set -e

# Variables - customize these
ACR_NAME="evinextjsappregistry"
RESOURCE_GROUP="evi-next-js-app-rg"
LOCATION="eastus"
CONTAINER_APP_NAME="evi-next-js-app"
CONTAINER_APP_ENV_NAME="evi-next-js-app-env"
IMAGE_NAME="evi-next-js-app"
IMAGE_TAG="latest"

echo "🚀 Creating Azure Container Registry if it doesn't exist..."
az acr create --name $ACR_NAME --resource-group $RESOURCE_GROUP --location $LOCATION --sku Basic --admin-enabled true

echo "🔑 Getting ACR credentials..."
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)

echo "🏗️ Building Docker image..."
docker build -t $IMAGE_NAME:$IMAGE_TAG .

echo "🏷️ Tagging Docker image for ACR..."
docker tag $IMAGE_NAME:$IMAGE_TAG $ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG

echo "🔐 Logging into ACR..."
echo $ACR_PASSWORD | docker login $ACR_NAME.azurecr.io --username $ACR_USERNAME --password-stdin

echo "📤 Pushing Docker image to ACR..."
docker push $ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG

echo "🌐 Creating Container App Environment if it doesn't exist..."
az containerapp env create \
  --name $CONTAINER_APP_ENV_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

echo "📦 Creating/Updating Container App..."
az containerapp create \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_APP_ENV_NAME \
  --image $ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG \
  --registry-server $ACR_NAME.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --target-port 3000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 10

echo "🎉 Deployment complete! Your app should be available soon at:"
echo "https://$CONTAINER_APP_NAME.$(az containerapp env show -n $CONTAINER_APP_ENV_NAME -g $RESOURCE_GROUP --query 'properties.defaultDomain' -o tsv)"
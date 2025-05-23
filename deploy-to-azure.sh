#!/bin/bash
set -e

# Variables - customize these
ACR_NAME="sarcasmrpza"
RESOURCE_GROUP="sarcasticrpza-rg"
LOCATION="eastus2"
CONTAINER_APP_NAME="sarcasm-rpza"
CONTAINER_APP_ENV_NAME="sarcasm-rpza-env"
IMAGE_NAME="sarcasm-rpza"
IMAGE_TAG="latest"

# Read API keys from files
OPENAI_API_KEY=$(cat openai_api_key.txt)
HUME_API_KEY=$(cat hume_api_key.txt)
HUME_SECRET_KEY=$(cat hume_secret_key.txt)

echo "🚀 Creating Azure Container Registry if it doesn't exist..."
# Check if ACR exists first to avoid error
ACR_EXISTS=$(az acr check-name --name $ACR_NAME --query nameAvailable -o tsv)
if [ "$ACR_EXISTS" == "false" ]; then
  echo "ACR $ACR_NAME already exists, skipping creation..."
else
  az acr create --name $ACR_NAME --resource-group $RESOURCE_GROUP --location $LOCATION --sku Basic --admin-enabled true
fi

echo "🔑 Getting ACR credentials..."
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)

echo "🏗️ Building Docker image with secrets..."
docker build -t $IMAGE_NAME:$IMAGE_TAG \
  --secret id=openai_key,src=openai_api_key.txt \
  --secret id=hume_key,src=hume_api_key.txt \
  --secret id=hume_secret,src=hume_secret_key.txt .

echo "🏷️ Tagging Docker image for ACR..."
docker tag $IMAGE_NAME:$IMAGE_TAG $ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG

echo "🔐 Logging into ACR..."
echo $ACR_PASSWORD | docker login $ACR_NAME.azurecr.io --username $ACR_USERNAME --password-stdin

echo "📤 Pushing Docker image to ACR..."
docker push $ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG

echo "🌐 Creating Container App Environment if it doesn't exist..."
# Check if Container App Environment exists
ENV_EXISTS=$(az containerapp env list --resource-group $RESOURCE_GROUP --query "[?name=='$CONTAINER_APP_ENV_NAME'].name" -o tsv)
if [ -n "$ENV_EXISTS" ]; then
  echo "Container App Environment $CONTAINER_APP_ENV_NAME already exists, skipping creation..."
else
  az containerapp env create \
    --name $CONTAINER_APP_ENV_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION
fi

echo "📦 Creating/Updating Container App..."
# Check if Container App exists
APP_EXISTS=$(az containerapp list --resource-group $RESOURCE_GROUP --query "[?name=='$CONTAINER_APP_NAME'].name" -o tsv)
if [ -n "$APP_EXISTS" ]; then
  echo "Updating existing Container App $CONTAINER_APP_NAME..."
  
  # Try to set revision mode to multiple - this will fail if already in multiple mode, but that's ok
  echo "Setting Container App to multiple revision mode..."
  az containerapp revision set-mode \
    --name $CONTAINER_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --mode multiple || echo "App is already in multiple revision mode or couldn't be changed"
  
  # Generate a unique revision name with timestamp to force update
  REVISION_NAME="rev-$(date +%Y%m%d%H%M%S)"
  
  # Update the Container App with the new image and force a new revision
  # Set environment variables using the proper format for az containerapp update
  echo "Deploying new revision with updated image and environment variables..."
  az containerapp update \
    --name $CONTAINER_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --image $ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG \
    --revision-suffix $REVISION_NAME \
    --set-env-vars OPENAI_API_KEY="$OPENAI_API_KEY" HUME_API_KEY="$HUME_API_KEY" HUME_SECRET_KEY="$HUME_SECRET_KEY"
  
  # Try to route traffic to the new revision - this might fail if in single revision mode
  echo "Attempting to route traffic to the new revision..."
  # Get the latest active revision name
  LATEST_REVISION=$(az containerapp revision list --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --query "reverse(sort_by([?properties.active], &properties.createdTime))[0].name" -o tsv)
  
  if [ -n "$LATEST_REVISION" ]; then
    echo "Setting 100% traffic to latest revision: $LATEST_REVISION"
    # Set traffic to the latest revision (100%) - this might fail if in single revision mode
    az containerapp ingress traffic set \
      --name $CONTAINER_APP_NAME \
      --resource-group $RESOURCE_GROUP \
      --revision-weight $LATEST_REVISION=100 || echo "Failed to set traffic weights - app may be in single revision mode"
    
    # Try to deactivate old revisions - this might fail if in single revision mode
    echo "Attempting to deactivate old revisions to save resources..."
    ACTIVE_REVISIONS=$(az containerapp revision list --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --query "[?properties.active && name!='$LATEST_REVISION'].name" -o tsv)
    for rev in $ACTIVE_REVISIONS; do
      echo "Attempting to deactivate revision: $rev"
      az containerapp revision deactivate --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --revision $rev || echo "Failed to deactivate revision $rev - app may be in single revision mode"
    done
  else
    echo "Could not determine latest revision - skipping traffic routing"
  fi
else
  echo "Creating new Container App $CONTAINER_APP_NAME..."
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
    --max-replicas 5 \
    --cpu 2 \
    --memory 4.0Gi \
    --env-vars OPENAI_API_KEY="$OPENAI_API_KEY" HUME_API_KEY="$HUME_API_KEY" HUME_SECRET_KEY="$HUME_SECRET_KEY"
  
  # Try to set to multiple revision mode for future updates
  echo "Setting new Container App to multiple revision mode..."
  az containerapp revision set-mode \
    --name $CONTAINER_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --mode multiple || echo "Failed to set multiple revision mode"
fi

echo "🎉 Deployment complete! Your app should be available soon at:"
echo "https://$CONTAINER_APP_NAME.$(az containerapp env show -n $CONTAINER_APP_ENV_NAME -g $RESOURCE_GROUP --query 'properties.defaultDomain' -o tsv)"
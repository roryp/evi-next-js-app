# Variables - customize these
$ACR_NAME = "evinextjsappregistry"
$RESOURCE_GROUP = "evi-next-js-app-rg"
$LOCATION = "eastus"
$CONTAINER_APP_NAME = "evi-next-js-app"
$CONTAINER_APP_ENV_NAME = "evi-next-js-app-env"
$IMAGE_NAME = "evi-next-js-app"
$IMAGE_TAG = "latest"

# Read API keys from files
$OPENAI_API_KEY = Get-Content -Path .\openai_api_key.txt -Raw
$HUME_API_KEY = Get-Content -Path .\hume_api_key.txt -Raw
$HUME_SECRET_KEY = Get-Content -Path .\hume_secret_key.txt -Raw

Write-Host "🚀 Creating Azure Container Registry if it doesn't exist..." -ForegroundColor Cyan
az acr create --name $ACR_NAME --resource-group $RESOURCE_GROUP --location $LOCATION --sku Basic --admin-enabled true

Write-Host "🔑 Getting ACR credentials..." -ForegroundColor Cyan
$ACR_USERNAME = az acr credential show --name $ACR_NAME --query username -o tsv
$ACR_PASSWORD = az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv

Write-Host "🏗️ Building Docker image with secrets..." -ForegroundColor Cyan
docker build -t $IMAGE_NAME`:$IMAGE_TAG `
  --secret id=openai_key,src=openai_api_key.txt `
  --secret id=hume_key,src=hume_api_key.txt `
  --secret id=hume_secret,src=hume_secret_key.txt .

Write-Host "🏷️ Tagging Docker image for ACR..." -ForegroundColor Cyan
docker tag $IMAGE_NAME`:$IMAGE_TAG $ACR_NAME.azurecr.io/$IMAGE_NAME`:$IMAGE_TAG

Write-Host "🔐 Logging into ACR..." -ForegroundColor Cyan
$ACR_PASSWORD | docker login $ACR_NAME.azurecr.io --username $ACR_USERNAME --password-stdin

Write-Host "📤 Pushing Docker image to ACR..." -ForegroundColor Cyan
docker push $ACR_NAME.azurecr.io/$IMAGE_NAME`:$IMAGE_TAG

Write-Host "🌐 Creating Container App Environment if it doesn't exist..." -ForegroundColor Cyan
az containerapp env create `
  --name $CONTAINER_APP_ENV_NAME `
  --resource-group $RESOURCE_GROUP `
  --location $LOCATION

Write-Host "📦 Creating/Updating Container App..." -ForegroundColor Cyan
az containerapp create `
  --name $CONTAINER_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --environment $CONTAINER_APP_ENV_NAME `
  --image $ACR_NAME.azurecr.io/$IMAGE_NAME`:$IMAGE_TAG `
  --registry-server $ACR_NAME.azurecr.io `
  --registry-username $ACR_USERNAME `
  --registry-password $ACR_PASSWORD `
  --target-port 3000 `
  --ingress external `
  --min-replicas 1 `
  --max-replicas 5 `
  --cpu 2 `
  --memory 4.0Gi `
  --env-vars OPENAI_API_KEY=$OPENAI_API_KEY HUME_API_KEY=$HUME_API_KEY HUME_SECRET_KEY=$HUME_SECRET_KEY

Write-Host "🎉 Deployment complete! Your app should be available soon at:" -ForegroundColor Green
$domain = az containerapp env show -n $CONTAINER_APP_ENV_NAME -g $RESOURCE_GROUP --query 'properties.defaultDomain' -o tsv
Write-Host "https://$CONTAINER_APP_NAME.$domain" -ForegroundColor Yellow
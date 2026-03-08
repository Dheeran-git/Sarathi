$API_ID = "mvbx0sv4n3"
$REGION = "us-east-1"
$RESOURCES = @("gl53tw", "wa6g2t") # upload-url, analyze

$headers = "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'"
$methods = "'GET,POST,OPTIONS'"
$origin = "'*'"

foreach ($resId in $RESOURCES) {
    Write-Host "Fixing CORS for resource $resId"
    
    # 1. Ensure OPTIONS method exists (ignore conflict)
    try {
        aws apigateway put-method --rest-api-id $API_ID --resource-id $resId --http-method OPTIONS --authorization-type NONE --region $REGION --no-cli-pager
    } catch {
        Write-Host "Method might already exist, continuing..."
    }
    
    # 2. Add MOCK integration
    aws apigateway put-integration --rest-api-id $API_ID --resource-id $resId --http-method OPTIONS --type MOCK --request-templates '{"application/json": "{\"statusCode\": 200}"}' --region $REGION --no-cli-pager
    
    # 3. Add Method Response
    aws apigateway put-method-response --rest-api-id $API_ID --resource-id $resId --http-method OPTIONS --status-code 200 --response-parameters "method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false" --region $REGION --no-cli-pager
    
    # 4. Add Integration Response with CORS headers
    $params = "{ `"method.response.header.Access-Control-Allow-Headers`": $headers, `"method.response.header.Access-Control-Allow-Methods`": $methods, `"method.response.header.Access-Control-Allow-Origin`": $origin }"
    aws apigateway put-integration-response --rest-api-id $API_ID --resource-id $resId --http-method OPTIONS --status-code 200 --response-parameters "$params" --region $REGION --no-cli-pager
    
    Write-Host "CORS fixed for $resId"
}

# Deploy to prod stage
Write-Host "Deploying to prod stage..."
aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod --region $REGION --no-cli-pager
Write-Host "Deployment complete."

# API Gateway Setup Script for Sarathi
# Creates all 6 routes with Lambda integrations and CORS

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$API_ID = "mvbx0sv4n3"
$REGION = "us-east-1"
$ACCOUNT_ID = "056048976827"
$ROOT_ID = "sk9mufziy6"

# Helper: Create resource, POST/GET method, Lambda integration, and OPTIONS for CORS
function Create-Route {
    param($Path, $Method, $LambdaName, $ParentId)

    Write-Host "`n--- Creating /$Path ($Method -> $LambdaName) ---"

    # Create resource
    $resJson = aws apigateway create-resource --rest-api-id $API_ID --parent-id $ParentId --path-part $Path --region $REGION --output json
    $res = $resJson | ConvertFrom-Json
    $resourceId = $res.id
    Write-Host "  Resource ID: $resourceId"

    # Create method (no auth)
    aws apigateway put-method --rest-api-id $API_ID --resource-id $resourceId --http-method $Method --authorization-type NONE --region $REGION --output text | Out-Null
    Write-Host "  Method: $Method"

    # Lambda integration
    $lambdaArn = "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${LambdaName}"
    $integUri = "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${lambdaArn}/invocations"
    aws apigateway put-integration --rest-api-id $API_ID --resource-id $resourceId --http-method $Method --type AWS_PROXY --integration-http-method POST --uri $integUri --region $REGION --output text | Out-Null
    Write-Host "  Integration: $LambdaName"

    # Add Lambda permission for API Gateway to invoke
    $stmtId = "apigateway-$LambdaName-$(Get-Random)"
    aws lambda add-permission --function-name $LambdaName --statement-id $stmtId --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/${Method}/*" --region $REGION --output text | Out-Null
    Write-Host "  Permission granted"

    # Method response
    aws apigateway put-method-response --rest-api-id $API_ID --resource-id $resourceId --http-method $Method --status-code 200 --response-parameters "method.response.header.Access-Control-Allow-Origin=false" --region $REGION --output text | Out-Null

    # --- CORS: OPTIONS method ---
    aws apigateway put-method --rest-api-id $API_ID --resource-id $resourceId --http-method OPTIONS --authorization-type NONE --region $REGION --output text | Out-Null

    aws apigateway put-integration --rest-api-id $API_ID --resource-id $resourceId --http-method OPTIONS --type MOCK --request-templates '{"application/json": "{\"statusCode\": 200}"}' --region $REGION --output text | Out-Null

    aws apigateway put-method-response --rest-api-id $API_ID --resource-id $resourceId --http-method OPTIONS --status-code 200 --response-parameters "method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false" --region $REGION --output text | Out-Null

    aws apigateway put-integration-response --rest-api-id $API_ID --resource-id $resourceId --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Headers": "'\''Content-Type,Authorization'\''", "method.response.header.Access-Control-Allow-Methods": "'\''GET,POST,OPTIONS'\''", "method.response.header.Access-Control-Allow-Origin": "'\''*'\''"}' --region $REGION --output text | Out-Null

    Write-Host "  CORS enabled"

    return $resourceId
}

# 1. /eligibility (POST)
Create-Route -Path "eligibility" -Method POST -LambdaName "sarathi-eligibility-engine" -ParentId $ROOT_ID

# 2. /twin (POST)
Create-Route -Path "twin" -Method POST -LambdaName "sarathi-digital-twin" -ParentId $ROOT_ID

# 3. /scheme (parent) then {schemeId} (GET)
Write-Host "`n--- Creating /scheme/{schemeId} (GET -> sarathi-scheme-fetch) ---"
$schemeResJson = aws apigateway create-resource --rest-api-id $API_ID --parent-id $ROOT_ID --path-part "scheme" --region $REGION --output json
$schemeResId = ($schemeResJson | ConvertFrom-Json).id
$schemeIdResId = Create-Route -Path "{schemeId}" -Method GET -LambdaName "sarathi-scheme-fetch" -ParentId $schemeResId

# 4. /panchayat (parent) then {panchayatId} (GET)
Write-Host "`n--- Creating /panchayat/{panchayatId} (GET -> sarathi-panchayat-stats) ---"
$panchResJson = aws apigateway create-resource --rest-api-id $API_ID --parent-id $ROOT_ID --path-part "panchayat" --region $REGION --output json
$panchResId = ($panchResJson | ConvertFrom-Json).id
$panchIdResId = Create-Route -Path "{panchayatId}" -Method GET -LambdaName "sarathi-panchayat-stats" -ParentId $panchResId

# 5. /citizen (POST)
Create-Route -Path "citizen" -Method POST -LambdaName "sarathi-citizen-save" -ParentId $ROOT_ID

# 6. /conflicts (POST)
Create-Route -Path "conflicts" -Method POST -LambdaName "sarathi-conflict-detector" -ParentId $ROOT_ID

# Deploy to prod stage
Write-Host "`n--- Deploying to prod stage ---"
$deployJson = aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod --region $REGION --output json
Write-Host $deployJson

$invokeUrl = "https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod"
Write-Host "`n========================================="
Write-Host "API Gateway deployed successfully!"
Write-Host "Invoke URL: $invokeUrl"
Write-Host "========================================="

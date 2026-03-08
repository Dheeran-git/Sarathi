$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
$API_ID = "mvbx0sv4n3"
$REGION = "us-east-1"
$ACCOUNT_ID = "056048976827"

function Get-APIResource {
    param($Path)
    $res = aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query "items[?path=='$Path'].id" --output text
    return $res.Trim()
}

$ROOT_ID = Get-APIResource "/"

function Create-Route {
    param($PathPart, $Method, $LambdaName, $ParentId)
    Write-Host "Create $PathPart ($Method -> $LambdaName)"
    $resId = Get-APIResource "/*/$PathPart"
    if (-not $resId) {
        $resJson = aws apigateway create-resource --rest-api-id $API_ID --parent-id $ParentId --path-part $PathPart --region $REGION --output json
        $resId = ($resJson | ConvertFrom-Json).id
    }
    aws apigateway put-method --rest-api-id $API_ID --resource-id $resId --http-method $Method --authorization-type NONE --region $REGION --output text | Out-Null
    $lambdaArn = "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${LambdaName}"
    $integUri = "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${lambdaArn}/invocations"
    aws apigateway put-integration --rest-api-id $API_ID --resource-id $resId --http-method $Method --type AWS_PROXY --integration-http-method POST --uri $integUri --region $REGION --output text | Out-Null
    $stmtId = "apigateway-$LambdaName-$(Get-Random)"
    aws lambda add-permission --function-name $LambdaName --statement-id $stmtId --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/${Method}/*" --region $REGION --output text | Out-Null
    aws apigateway put-method-response --rest-api-id $API_ID --resource-id $resId --http-method $Method --status-code 200 --response-parameters "method.response.header.Access-Control-Allow-Origin=false" --region $REGION --output text | Out-Null
    # CORS
    aws apigateway put-method --rest-api-id $API_ID --resource-id $resId --http-method OPTIONS --authorization-type NONE --region $REGION --output text | Out-Null
    aws apigateway put-integration --rest-api-id $API_ID --resource-id $resId --http-method OPTIONS --type MOCK --request-templates '{"application/json": "{\"statusCode\": 200}"}' --region $REGION --output text | Out-Null
    aws apigateway put-method-response --rest-api-id $API_ID --resource-id $resId --http-method OPTIONS --status-code 200 --response-parameters "method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false" --region $REGION --output text | Out-Null
    aws apigateway put-integration-response --rest-api-id $API_ID --resource-id $resId --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Headers": "'\''Content-Type,Authorization'\''", "method.response.header.Access-Control-Allow-Methods": "'\''GET,POST,OPTIONS'\''", "method.response.header.Access-Control-Allow-Origin": "'\''*'\''"}' --region $REGION --output text | Out-Null
    return $resId
}

Write-Host "Fetching resource IDs..."
$citizenResId = Get-APIResource "/citizen"
Create-Route "{userId}" "GET" "sarathi-citizen-save" $citizenResId

$agentResId = Create-Route "agent" "POST" "sarathi-agent-invoke" $ROOT_ID

$docResId = Get-APIResource "/document"
if (-not $docResId) {
    $docJson = aws apigateway create-resource --rest-api-id $API_ID --parent-id $ROOT_ID --path-part "document" --region $REGION --output json
    $docResId = ($docJson | ConvertFrom-Json).id
}
Create-Route "upload-url" "POST" "sarathi-document-upload-url" $docResId
Create-Route "analyze" "POST" "sarathi-document-analyzer" $docResId

$schemeResId = Get-APIResource "/scheme"
Create-Route "search-ai" "POST" "sarathi-scheme-fetch" $schemeResId
Create-Route "compare" "POST" "sarathi-scheme-fetch" $schemeResId

aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod --region $REGION
Write-Host "Deployed missing routes."

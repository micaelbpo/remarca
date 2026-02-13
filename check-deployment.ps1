# Check if the latest code is deployed
$baseUrl = "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev"

Write-Host "=== CHECKING DEPLOYMENT STATUS ===" -ForegroundColor Cyan

# Test health endpoint
Write-Host "`n[1] Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing
    Write-Host "OK API is responding" -ForegroundColor Green
} catch {
    Write-Host "X API is not responding" -ForegroundColor Red
    exit 1
}

# Test registration with detailed error
Write-Host "`n[2] Testing registration endpoint..." -ForegroundColor Yellow

$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$testEmail = "deploy-test-$timestamp@example.com"

$registerBody = @{
    email = $testEmail
    password = "Test123456!"
    name = "Deploy Test"
    tenantId = "tenant-001"
    userType = "PROFESSIONAL"
} | ConvertTo-Json

Write-Host "  Registering: $testEmail" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/register" `
        -Method Post `
        -Body $registerBody `
        -ContentType "application/json" `
        -UseBasicParsing
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host "OK Registration successful!" -ForegroundColor Green
    Write-Host "  User ID: $($data.userId)" -ForegroundColor Gray
    
    Write-Host "`n=== DEPLOYMENT CHECK PASSED ===" -ForegroundColor Green
    Write-Host "The latest code is deployed and working!" -ForegroundColor Green
    
} catch {
    Write-Host "X Registration failed!" -ForegroundColor Red
    
    $errorBody = $_.ErrorDetails.Message
    Write-Host "`nError details:" -ForegroundColor Red
    Write-Host $errorBody -ForegroundColor Red
    
    # Check if it's a DynamoDB permission error
    if ($errorBody -like "*not authorized*dynamodb*") {
        Write-Host "`nDIAGNOSIS: Lambda doesn't have DynamoDB permissions" -ForegroundColor Yellow
        Write-Host "The code is deployed but IAM permissions are missing" -ForegroundColor Yellow
    }
    # Check if it's the old code
    elseif ($errorBody -like "*custom:tenantId*" -or $errorBody -like "*custom:userType*") {
        Write-Host "`nDIAGNOSIS: Old code is still deployed" -ForegroundColor Yellow
        Write-Host "The latest changes haven't been deployed yet" -ForegroundColor Yellow
    }
    # Check if it's a DynamoDB error
    elseif ($errorBody -like "*Failed to put item*") {
        Write-Host "`nDIAGNOSIS: DynamoDB write error" -ForegroundColor Yellow
        Write-Host "Code is deployed but DynamoDB operation failed" -ForegroundColor Yellow
    }
    else {
        Write-Host "`nDIAGNOSIS: Unknown error" -ForegroundColor Yellow
        Write-Host "Check GitHub Actions logs for details" -ForegroundColor Yellow
    }
    
    Write-Host "`nGitHub Actions: https://github.com/micaelbpo/remarca/actions" -ForegroundColor Cyan
}

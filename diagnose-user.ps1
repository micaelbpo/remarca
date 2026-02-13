# Diagnose user login issue
$baseUrl = "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev"

Write-Host "=== USER LOGIN DIAGNOSTICS ===" -ForegroundColor Cyan

$email = Read-Host "`nEnter your email"
$password = Read-Host "Enter your password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

Write-Host "`n[1/2] Testing login..." -ForegroundColor Yellow

$loginBody = @{
    email = $email
    password = $passwordPlain
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json" `
        -UseBasicParsing
    
    Write-Host "OK Login successful!" -ForegroundColor Green
    
    $loginData = $response.Content | ConvertFrom-Json
    
    Write-Host "`n=== USER PROFILE ===" -ForegroundColor Cyan
    $loginData.user | ConvertTo-Json -Depth 5 | Write-Host
    
    # Validate profile
    Write-Host "`n[2/2] Validating profile..." -ForegroundColor Yellow
    
    $issues = @()
    if (-not $loginData.user.userType) { $issues += "userType is missing" }
    if (-not $loginData.user.tenantId) { $issues += "tenantId is missing" }
    if (-not $loginData.user.email) { $issues += "email is missing" }
    if (-not $loginData.user.name) { $issues += "name is missing" }
    
    if ($issues.Count -eq 0) {
        Write-Host "OK Profile is complete!" -ForegroundColor Green
    } else {
        Write-Host "X Profile has issues:" -ForegroundColor Red
        $issues | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    }
    
} catch {
    Write-Host "X Login failed!" -ForegroundColor Red
    
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "  Status Code: $statusCode" -ForegroundColor Red
    
    $errorBody = $_.ErrorDetails.Message
    Write-Host "`nError Response:" -ForegroundColor Red
    $errorBody | Write-Host -ForegroundColor Red
    
    try {
        $errorData = $errorBody | ConvertFrom-Json
        $errorMessage = $errorData.error.message
        
        Write-Host "`n=== DIAGNOSIS ===" -ForegroundColor Yellow
        
        if ($errorMessage -like "*User profile not found*") {
            Write-Host "ISSUE: User exists in Cognito but not in DynamoDB" -ForegroundColor Yellow
            Write-Host "`nPossible causes:" -ForegroundColor Yellow
            Write-Host "1. User was registered before the DynamoDB save code was deployed" -ForegroundColor Gray
            Write-Host "2. DynamoDB write failed during registration" -ForegroundColor Gray
            Write-Host "3. User was deleted from DynamoDB but not from Cognito" -ForegroundColor Gray
            
            Write-Host "`nSOLUTION:" -ForegroundColor Cyan
            Write-Host "1. Delete this user from Cognito (via AWS Console)" -ForegroundColor Gray
            Write-Host "2. Register again with the same email" -ForegroundColor Gray
            Write-Host "3. The new registration will save to DynamoDB correctly" -ForegroundColor Gray
            
            Write-Host "`nAWS Console Cognito:" -ForegroundColor Cyan
            Write-Host "https://console.aws.amazon.com/cognito/v2/idp/user-pools" -ForegroundColor Cyan
            
        } elseif ($errorMessage -like "*not confirmed*") {
            Write-Host "ISSUE: Email not confirmed" -ForegroundColor Yellow
            Write-Host "`nSOLUTION: Check your email for verification code" -ForegroundColor Cyan
            
        } elseif ($errorMessage -like "*Invalid*password*") {
            Write-Host "ISSUE: Incorrect password" -ForegroundColor Yellow
            Write-Host "`nSOLUTION: Check your password and try again" -ForegroundColor Cyan
            
        } else {
            Write-Host "ISSUE: $errorMessage" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "Could not parse error details" -ForegroundColor Gray
    }
}

Write-Host "`n=== END DIAGNOSTICS ===" -ForegroundColor Cyan

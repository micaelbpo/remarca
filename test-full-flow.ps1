# Complete test flow: Register -> Confirm -> Login
$baseUrl = "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev"

# Generate unique email
$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$testEmail = "test-$timestamp@example.com"
$testPassword = "Test123456"
$testName = "Test User"

Write-Host "`n=== REMARCA TEST FLOW ===" -ForegroundColor Cyan
Write-Host "Email: $testEmail" -ForegroundColor Gray
Write-Host "Password: $testPassword" -ForegroundColor Gray

# Step 1: Register
Write-Host "`n[1/3] Testing registration..." -ForegroundColor Yellow

$registerBody = @{
    email = $testEmail
    password = $testPassword
    name = $testName
    tenantId = "tenant-001"
    userType = "PROFESSIONAL"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/register" `
        -Method Post `
        -Body $registerBody `
        -ContentType "application/json" `
        -UseBasicParsing
    
    Write-Host "✓ Registration successful!" -ForegroundColor Green
    $registerData = $response.Content | ConvertFrom-Json
    Write-Host "  User ID: $($registerData.userId)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Registration failed!" -ForegroundColor Red
    Write-Host "  Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Confirm Email
Write-Host "`n[2/3] Email confirmation required" -ForegroundColor Yellow
Write-Host "  Check your email for the verification code" -ForegroundColor Gray
Write-Host "  Email: $testEmail" -ForegroundColor Cyan

$code = Read-Host "`nEnter the verification code from email"

$confirmBody = @{
    email = $testEmail
    code = $code
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/confirm" `
        -Method Post `
        -Body $confirmBody `
        -ContentType "application/json" `
        -UseBasicParsing
    
    Write-Host "✓ Email confirmed successfully!" -ForegroundColor Green
} catch {
    Write-Host "✗ Email confirmation failed!" -ForegroundColor Red
    Write-Host "  Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
    Write-Host "`nYou can still try to login if the code was correct" -ForegroundColor Yellow
}

# Step 3: Login
Write-Host "`n[3/3] Testing login..." -ForegroundColor Yellow

$loginBody = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json" `
        -UseBasicParsing
    
    Write-Host "✓ Login successful!" -ForegroundColor Green
    $loginData = $response.Content | ConvertFrom-Json
    
    Write-Host "`n=== LOGIN RESPONSE ===" -ForegroundColor Cyan
    Write-Host "Access Token: $($loginData.accessToken.Substring(0, 50))..." -ForegroundColor Gray
    Write-Host "Expires In: $($loginData.expiresIn) seconds" -ForegroundColor Gray
    
    Write-Host "`n=== USER DATA ===" -ForegroundColor Cyan
    $loginData.user | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor Gray
    
    # Validate user data
    if ($loginData.user.userType -and $loginData.user.tenantId) {
        Write-Host "`n✓ User profile is complete!" -ForegroundColor Green
    } else {
        Write-Host "`n✗ WARNING: User profile is incomplete!" -ForegroundColor Red
        Write-Host "  Missing: " -NoNewline -ForegroundColor Red
        if (-not $loginData.user.userType) { Write-Host "userType " -NoNewline -ForegroundColor Red }
        if (-not $loginData.user.tenantId) { Write-Host "tenantId " -NoNewline -ForegroundColor Red }
        Write-Host ""
    }
    
} catch {
    Write-Host "✗ Login failed!" -ForegroundColor Red
    Write-Host "  Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "  Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
    
    # Parse error details
    try {
        $errorData = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "`n  Error Code: $($errorData.error.code)" -ForegroundColor Red
        Write-Host "  Message: $($errorData.error.message)" -ForegroundColor Red
        
        # Provide helpful hints
        if ($errorData.error.message -like "*not confirmed*") {
            Write-Host "`n  HINT: Your email is not confirmed yet. Check your email for the verification code." -ForegroundColor Yellow
        } elseif ($errorData.error.message -like "*Invalid*password*") {
            Write-Host "`n  HINT: The password is incorrect." -ForegroundColor Yellow
        } elseif ($errorData.error.message -like "*User not found*") {
            Write-Host "`n  HINT: The user doesn't exist. Registration may have failed." -ForegroundColor Yellow
        }
    } catch {
        # Could not parse error
    }
    
    exit 1
}

Write-Host "`n=== TEST COMPLETED SUCCESSFULLY ===" -ForegroundColor Green

# Quick test with a new user
$baseUrl = "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev"

# Generate unique email
$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$testEmail = "test-$timestamp@example.com"
$testPassword = "Test123456!"
$testName = "Test User $timestamp"

Write-Host "`n=== QUICK TEST ===" -ForegroundColor Cyan
Write-Host "Creating new user..." -ForegroundColor Yellow
Write-Host "Email: $testEmail" -ForegroundColor Gray
Write-Host "Password: $testPassword" -ForegroundColor Gray

# Register
$registerBody = @{
    email = $testEmail
    password = $testPassword
    name = $testName
    tenantId = "tenant-001"
    userType = "PROFESSIONAL"
} | ConvertTo-Json

Write-Host "`n[1/3] Registering..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/register" `
        -Method Post `
        -Body $registerBody `
        -ContentType "application/json" `
        -UseBasicParsing
    
    $registerData = $response.Content | ConvertFrom-Json
    Write-Host "OK Registration successful!" -ForegroundColor Green
    Write-Host "  User ID: $($registerData.userId)" -ForegroundColor Gray
} catch {
    Write-Host "X Registration failed!" -ForegroundColor Red
    Write-Host "  Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

# Wait for email
Write-Host "`n[2/3] Email confirmation" -ForegroundColor Yellow
Write-Host "  Check email: $testEmail" -ForegroundColor Cyan
Write-Host "  (This is a test email, you won't receive it)" -ForegroundColor Gray
Write-Host "  For real testing, use your actual email address" -ForegroundColor Gray

$code = Read-Host "`nEnter verification code (or press Enter to skip)"

if ($code) {
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
        
        Write-Host "OK Email confirmed!" -ForegroundColor Green
    } catch {
        Write-Host "X Confirmation failed: $($_.ErrorDetails.Message)" -ForegroundColor Red
        Write-Host "  Continuing anyway..." -ForegroundColor Yellow
    }

    # Try login
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
        
        Write-Host "OK Login successful!" -ForegroundColor Green
        
        $loginData = $response.Content | ConvertFrom-Json
        Write-Host "`nUser Profile:" -ForegroundColor Cyan
        $loginData.user | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
        
        if ($loginData.user.userType -and $loginData.user.tenantId) {
            Write-Host "`nOK Profile is complete!" -ForegroundColor Green
        } else {
            Write-Host "`nX Profile is incomplete!" -ForegroundColor Red
        }
    } catch {
        Write-Host "X Login failed!" -ForegroundColor Red
        Write-Host "  Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "`nSkipped confirmation and login test" -ForegroundColor Yellow
}

Write-Host "`n=== TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host "`nTo test with YOUR email:" -ForegroundColor Yellow
Write-Host "1. Register with your real email at: $baseUrl/auth/register" -ForegroundColor Gray
Write-Host "2. Check your email for verification code" -ForegroundColor Gray
Write-Host "3. Confirm at: $baseUrl/auth/confirm" -ForegroundColor Gray
Write-Host "4. Login at: $baseUrl/auth/login" -ForegroundColor Gray

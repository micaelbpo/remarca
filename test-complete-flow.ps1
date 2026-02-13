# Complete test: Register -> Confirm -> Login
$baseUrl = "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev"

Write-Host "=== COMPLETE FLOW TEST ===" -ForegroundColor Cyan

# Use your real email
$email = "micael.poloni@me.com"
$password = Read-Host "Enter password for $email" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
$name = "Micael Poloni"

Write-Host "`n[1/4] Deleting old user from Cognito..." -ForegroundColor Yellow
Write-Host "  Please delete user '$email' from AWS Console if it exists" -ForegroundColor Gray
Write-Host "  https://console.aws.amazon.com/cognito/v2/idp/user-pools" -ForegroundColor Cyan
$continue = Read-Host "`nPress Enter when done (or type 'skip' if already deleted)"

if ($continue -eq "skip") {
    Write-Host "  Skipped" -ForegroundColor Gray
}

Write-Host "`n[2/4] Registering user via API..." -ForegroundColor Yellow

$registerBody = @{
    email = $email
    password = $passwordPlain
    name = $name
    tenantId = "tenant-001"
    userType = "PROFESSIONAL"
} | ConvertTo-Json

Write-Host "  Request:" -ForegroundColor Gray
Write-Host $registerBody -ForegroundColor DarkGray

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/register" `
        -Method Post `
        -Body $registerBody `
        -ContentType "application/json" `
        -UseBasicParsing
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  OK Registration successful!" -ForegroundColor Green
    Write-Host "  User ID: $($data.userId)" -ForegroundColor Gray
    
} catch {
    Write-Host "  X Registration failed!" -ForegroundColor Red
    Write-Host "  Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n[3/4] Email confirmation..." -ForegroundColor Yellow
Write-Host "  Check your email: $email" -ForegroundColor Cyan
$code = Read-Host "  Enter verification code"

$confirmBody = @{
    email = $email
    code = $code
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/confirm" `
        -Method Post `
        -Body $confirmBody `
        -ContentType "application/json" `
        -UseBasicParsing
    
    Write-Host "  OK Email confirmed!" -ForegroundColor Green
    
} catch {
    Write-Host "  X Confirmation failed!" -ForegroundColor Red
    Write-Host "  Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
    Write-Host "  Continuing anyway..." -ForegroundColor Yellow
}

Write-Host "`n[4/4] Testing login..." -ForegroundColor Yellow

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
    
    Write-Host "  OK Login successful!" -ForegroundColor Green
    
    $loginData = $response.Content | ConvertFrom-Json
    
    Write-Host "`n=== USER PROFILE ===" -ForegroundColor Cyan
    $loginData.user | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
    
    # Validate profile
    if ($loginData.user.userType -and $loginData.user.tenantId -and $loginData.user.email) {
        Write-Host "`n=== SUCCESS! ===" -ForegroundColor Green
        Write-Host "Profile is complete and login works!" -ForegroundColor Green
        Write-Host "`nYou can now use the frontend:" -ForegroundColor Cyan
        Write-Host "  http://localhost:3000/login" -ForegroundColor Gray
    } else {
        Write-Host "`n=== WARNING ===" -ForegroundColor Yellow
        Write-Host "Profile is incomplete!" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "  X Login failed!" -ForegroundColor Red
    Write-Host "  Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== TEST COMPLETE ===" -ForegroundColor Cyan

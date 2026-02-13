# Test registration exactly as frontend does
$baseUrl = "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev"

Write-Host "=== TESTING FRONTEND REGISTRATION ===" -ForegroundColor Cyan

$email = Read-Host "`nEnter email"
$name = Read-Host "Enter name"
$password = Read-Host "Enter password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

Write-Host "`nUser Type:" -ForegroundColor Yellow
Write-Host "1. PATIENT" -ForegroundColor Gray
Write-Host "2. PROFESSIONAL" -ForegroundColor Gray
$userTypeChoice = Read-Host "Choose (1 or 2)"
$userType = if ($userTypeChoice -eq "2") { "PROFESSIONAL" } else { "PATIENT" }

$phone = Read-Host "Enter phone (optional, press Enter to skip)"

# Build request body exactly as frontend does
$body = @{
    email = $email
    password = $passwordPlain
    name = $name
    tenantId = "tenant-001"
    userType = $userType
}

# Add phone if provided
if ($phone -and $phone.Trim() -ne "") {
    # Add + prefix if not present
    if (-not $phone.StartsWith("+")) {
        $phone = "+" + ($phone -replace '\D', '')
    }
    $body.phone = $phone
}

$bodyJson = $body | ConvertTo-Json

Write-Host "`n=== REQUEST BODY ===" -ForegroundColor Cyan
Write-Host $bodyJson -ForegroundColor Gray

Write-Host "`n=== SENDING REQUEST ===" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/register" `
        -Method Post `
        -Body $bodyJson `
        -ContentType "application/json" `
        -UseBasicParsing
    
    Write-Host "OK Registration successful!" -ForegroundColor Green
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host "`n=== RESPONSE ===" -ForegroundColor Cyan
    $data | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
    
    Write-Host "`nUser ID: $($data.userId)" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Check your email for verification code" -ForegroundColor Gray
    Write-Host "2. Confirm email at: http://localhost:3000/confirm-email?email=$email" -ForegroundColor Gray
    Write-Host "3. Login at: http://localhost:3000/login" -ForegroundColor Gray
    
} catch {
    Write-Host "X Registration failed!" -ForegroundColor Red
    Write-Host "  Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    
    $errorBody = $_.ErrorDetails.Message
    Write-Host "`n=== ERROR RESPONSE ===" -ForegroundColor Red
    Write-Host $errorBody -ForegroundColor Red
    
    try {
        $errorData = $errorBody | ConvertFrom-Json
        Write-Host "`nError Code: $($errorData.error.code)" -ForegroundColor Red
        Write-Host "Message: $($errorData.error.message)" -ForegroundColor Red
    } catch {
        # Could not parse
    }
}

Write-Host "`n=== END TEST ===" -ForegroundColor Cyan

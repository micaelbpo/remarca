# Test if we can write to DynamoDB by creating a test patient
$baseUrl = "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev"

Write-Host "=== TESTING DYNAMODB WRITE ===" -ForegroundColor Cyan
Write-Host "This will test if Lambda can write to DynamoDB" -ForegroundColor Gray

# First, we need a valid token
Write-Host "`n[1/2] Getting authentication token..." -ForegroundColor Yellow
Write-Host "We'll use the test user we created earlier" -ForegroundColor Gray

$loginBody = @{
    email = "test-direct-20260213154524@example.com"
    password = "Test123456!"
} | ConvertTo-Json

try {
    # This will fail because email not confirmed, but that's OK
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json" `
        -UseBasicParsing
} catch {
    Write-Host "  (Expected - email not confirmed)" -ForegroundColor Gray
}

Write-Host "`n[2/2] Testing DynamoDB write via Patient creation..." -ForegroundColor Yellow
Write-Host "This endpoint also writes to DynamoDB" -ForegroundColor Gray

$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$patientBody = @{
    tenantId = "tenant-001"
    name = "Test Patient $timestamp"
    email = "patient-$timestamp@example.com"
    phone = "+5511987654321"
    cpf = "12345678901"
    birthDate = "1990-01-01"
} | ConvertTo-Json

Write-Host "  Request:" -ForegroundColor Gray
Write-Host $patientBody -ForegroundColor DarkGray

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/patients" `
        -Method Post `
        -Body $patientBody `
        -ContentType "application/json" `
        -UseBasicParsing
    
    Write-Host "  OK Patient created successfully!" -ForegroundColor Green
    Write-Host "  Response:" -ForegroundColor Gray
    $response.Content | Write-Host -ForegroundColor DarkGray
    
    Write-Host "`n=== CONCLUSION ===" -ForegroundColor Cyan
    Write-Host "DynamoDB write works for Patients!" -ForegroundColor Green
    Write-Host "The problem is specific to the Register function" -ForegroundColor Yellow
    
} catch {
    Write-Host "  X Patient creation failed!" -ForegroundColor Red
    Write-Host "  Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
    
    Write-Host "`n=== CONCLUSION ===" -ForegroundColor Cyan
    Write-Host "DynamoDB write is failing for ALL functions" -ForegroundColor Red
    Write-Host "This indicates a broader permission or configuration issue" -ForegroundColor Yellow
}

Write-Host "`n=== END TEST ===" -ForegroundColor Cyan

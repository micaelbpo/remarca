# Test registration endpoint
$baseUrl = "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev"

Write-Host "Testing registration without phone..." -ForegroundColor Yellow

$body = @{
    email = "test-$(Get-Random)@example.com"
    password = "Test123456"
    name = "Test User"
    userType = "PROFESSIONAL"
    tenantId = "tenant-001"
} | ConvertTo-Json

Write-Host "Sending: $body" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/register" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -UseBasicParsing
    
    Write-Host "✓ Success!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "✗ Error!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $result = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($result)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Full Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host "`nTesting registration WITH phone..." -ForegroundColor Yellow

$bodyWithPhone = @{
    email = "test-$(Get-Random)@example.com"
    password = "Test123456"
    name = "Test User"
    phone = "+5511987654321"
    userType = "PROFESSIONAL"
    tenantId = "tenant-001"
} | ConvertTo-Json

Write-Host "Sending: $bodyWithPhone" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/register" `
        -Method Post `
        -Body $bodyWithPhone `
        -ContentType "application/json" `
        -UseBasicParsing
    
    Write-Host "✓ Success!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "✗ Error!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $result = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($result)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Full Response: $responseBody" -ForegroundColor Red
    }
}

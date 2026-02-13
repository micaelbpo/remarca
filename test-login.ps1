# Test login endpoint
$baseUrl = "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev"

Write-Host "Testing login..." -ForegroundColor Yellow

# Use credentials from a user you just registered
$email = Read-Host "Enter email"
$password = Read-Host "Enter password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

$body = @{
    email = $email
    password = $passwordPlain
} | ConvertTo-Json

Write-Host "Sending login request..." -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/login" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -UseBasicParsing
    
    Write-Host "Success!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Login Failed!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $result = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($result)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Full Response: $responseBody" -ForegroundColor Red
    }
}

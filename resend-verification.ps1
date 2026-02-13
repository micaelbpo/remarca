# Resend verification code
# Note: This requires AWS CLI to be configured

Write-Host "=== RESEND VERIFICATION CODE ===" -ForegroundColor Cyan

$email = Read-Host "Enter your email"

Write-Host "`nResending verification code..." -ForegroundColor Yellow

try {
    # Get User Pool ID from AWS
    $userPoolId = aws cognito-idp list-user-pools --max-results 10 --query "UserPools[?Name=='remarca-users-dev'].Id" --output text
    
    if (-not $userPoolId) {
        Write-Host "✗ Could not find User Pool" -ForegroundColor Red
        Write-Host "  Make sure AWS CLI is configured and you have access to the Cognito User Pool" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "  User Pool ID: $userPoolId" -ForegroundColor Gray
    
    # Resend confirmation code
    aws cognito-idp resend-confirmation-code `
        --client-id (aws cognito-idp list-user-pool-clients --user-pool-id $userPoolId --max-results 10 --query "UserPoolClients[0].ClientId" --output text) `
        --username $email
    
    Write-Host "✓ Verification code resent successfully!" -ForegroundColor Green
    Write-Host "  Check your email (including spam folder)" -ForegroundColor Gray
    
} catch {
    Write-Host "✗ Failed to resend verification code" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n  This script requires AWS CLI to be installed and configured." -ForegroundColor Yellow
    Write-Host "  Alternative: Use the AWS Console to resend the code manually." -ForegroundColor Yellow
}

# Check if user profile exists in DynamoDB
# This requires AWS CLI

Write-Host "=== CHECK DYNAMODB PROFILE ===" -ForegroundColor Cyan

$email = Read-Host "`nEnter user email"

Write-Host "`nSearching for user in DynamoDB..." -ForegroundColor Yellow

try {
    # Search for user by email in DynamoDB
    $result = aws dynamodb scan `
        --table-name remarca-dev `
        --filter-expression "email = :email" `
        --expression-attribute-values '{\":email\":{\"S\":\"'$email'\"}}' `
        --output json | ConvertFrom-Json
    
    if ($result.Items.Count -eq 0) {
        Write-Host "X User profile NOT found in DynamoDB" -ForegroundColor Red
        Write-Host "`nThis means:" -ForegroundColor Yellow
        Write-Host "- User exists in Cognito (you can confirm email)" -ForegroundColor Gray
        Write-Host "- But profile was NOT saved to DynamoDB during registration" -ForegroundColor Gray
        Write-Host "- Login will fail with 'User profile not found'" -ForegroundColor Gray
        
        Write-Host "`nPossible causes:" -ForegroundColor Yellow
        Write-Host "1. Registration happened before DynamoDB save code was deployed" -ForegroundColor Gray
        Write-Host "2. Lambda doesn't have DynamoDB write permissions" -ForegroundColor Gray
        Write-Host "3. DynamoDB write failed silently" -ForegroundColor Gray
        
        Write-Host "`nSOLUTION:" -ForegroundColor Cyan
        Write-Host "Delete user from Cognito and register again:" -ForegroundColor Gray
        Write-Host "1. AWS Console: https://console.aws.amazon.com/cognito/" -ForegroundColor Gray
        Write-Host "2. Delete user: $email" -ForegroundColor Gray
        Write-Host "3. Register again via: http://localhost:3000/register" -ForegroundColor Gray
        
    } else {
        Write-Host "OK User profile found in DynamoDB!" -ForegroundColor Green
        Write-Host "`n=== PROFILE DATA ===" -ForegroundColor Cyan
        $result.Items | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor Gray
        
        Write-Host "`nIf login still fails, the issue is elsewhere." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "X Error checking DynamoDB" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nThis script requires AWS CLI to be installed and configured." -ForegroundColor Yellow
    Write-Host "Alternative: Check DynamoDB via AWS Console" -ForegroundColor Yellow
    Write-Host "https://console.aws.amazon.com/dynamodb/" -ForegroundColor Cyan
}

Write-Host "`n=== END CHECK ===" -ForegroundColor Cyan

# GitHub Setup Script for PenPal Draw
# This script configures git to use the deploy key and pushes to GitHub

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   PenPal Draw - GitHub Setup Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Get the project directory
$projectDir = $PSScriptRoot
if (-not $projectDir) {
    $projectDir = Get-Location
}
Set-Location $projectDir

Write-Host "Project directory: $projectDir" -ForegroundColor Gray

# Check if deploy key exists
$deployKey = Join-Path $projectDir ".ssh\deploy_key"
$deployKeyPub = Join-Path $projectDir ".ssh\deploy_key.pub"

if (-not (Test-Path $deployKey)) {
    Write-Host "ERROR: Deploy key not found at $deployKey" -ForegroundColor Red
    Write-Host "Please run: ssh-keygen -t ed25519 -f .ssh/deploy_key -N ''" -ForegroundColor Yellow
    exit 1
}

Write-Host "Deploy key found: $deployKey" -ForegroundColor Green

# Show the public key
Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "   PUBLIC KEY (Add this to GitHub)" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""
Get-Content $deployKeyPub | Write-Host -ForegroundColor Cyan
Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

# Instructions
Write-Host "STEP 1: Add this key to GitHub" -ForegroundColor Green
Write-Host "   URL: https://github.com/cms000123456/penpal/settings/keys" -ForegroundColor Gray
Write-Host "   - Click 'Add deploy key'" -ForegroundColor Gray
Write-Host "   - Paste the key above" -ForegroundColor Gray
Write-Host "   - Check 'Allow write access'" -ForegroundColor Gray
Write-Host "   - Click 'Add key'" -ForegroundColor Gray
Write-Host ""

$continue = Read-Host "Have you added the key to GitHub? (y/n)"
if ($continue -ne 'y') {
    Write-Host "Please add the key to GitHub first, then run this script again." -ForegroundColor Yellow
    exit 0
}

# Configure git to use the deploy key
Write-Host "STEP 2: Configuring git to use deploy key..." -ForegroundColor Green

# Set the SSH command to use our deploy key
git config core.sshCommand "ssh -i `"$deployKey`" -F NUL"

# Verify configuration
$sshCommand = git config core.sshCommand
Write-Host "Git SSH command set to: $sshCommand" -ForegroundColor Gray

# Add remote
Write-Host "STEP 3: Adding GitHub remote..." -ForegroundColor Green

$remoteExists = git remote | Select-String "origin"
if ($remoteExists) {
    Write-Host "Remote 'origin' already exists, updating URL..." -ForegroundColor Yellow
    git remote set-url origin git@github.com:cms000123456/penpal.git
} else {
    git remote add origin git@github.com:cms000123456/penpal.git
}

# Verify remote
Write-Host "Remote configured:" -ForegroundColor Gray
git remote -v

# Stage all files
Write-Host ""
Write-Host "STEP 4: Staging files..." -ForegroundColor Green
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "Files to commit:" -ForegroundColor Gray
    git status --short
    
    $message = Read-Host "Enter commit message (or press Enter for 'Initial commit')"
    if (-not $message) {
        $message = "Initial commit: PenPal Draw app"
    }
    
    Write-Host ""
    Write-Host "STEP 5: Committing..." -ForegroundColor Green
    git commit -m "$message"
    
    # Push
    Write-Host ""
    Write-Host "STEP 6: Pushing to GitHub..." -ForegroundColor Green
    
    # Check current branch
    $branch = git branch --show-current
    Write-Host "Current branch: $branch" -ForegroundColor Gray
    
    git push -u origin $branch
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Green
        Write-Host "   SUCCESS! Code pushed to GitHub!" -ForegroundColor Green
        Write-Host "============================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Repository URL: https://github.com/cms000123456/penpal" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "ERROR: Push failed. Check error messages above." -ForegroundColor Red
    }
} else {
    Write-Host "No changes to commit." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green

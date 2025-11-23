# Railway Quick Deploy Script
# Run this script to prepare and deploy to Railway

Write-Host "🚀 Railway Deployment Script" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "📦 Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git initialized`n" -ForegroundColor Green
}

# Check if Railway CLI is installed
Write-Host "🔍 Checking Railway CLI..." -ForegroundColor Yellow
$railwayCli = Get-Command railway -ErrorAction SilentlyContinue

if (-not $railwayCli) {
    Write-Host "⚠️  Railway CLI not found" -ForegroundColor Red
    Write-Host "📥 Installing Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
    Write-Host "✅ Railway CLI installed`n" -ForegroundColor Green
} else {
    Write-Host "✅ Railway CLI found`n" -ForegroundColor Green
}

# Test the app locally first
Write-Host "🧪 Testing app locally..." -ForegroundColor Yellow
Write-Host "Starting server for 5 seconds to verify...`n" -ForegroundColor Gray

$serverProcess = Start-Process -FilePath "node" -ArgumentList "server.js" -PassThru -NoNewWindow

Start-Sleep -Seconds 5

# Test health endpoint
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 3
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Local server test passed`n" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Could not test local server (may be normal)`n" -ForegroundColor Yellow
}

# Stop test server
if ($serverProcess) {
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
}

# Show deployment options
Write-Host "🎯 Deployment Options:`n" -ForegroundColor Cyan

Write-Host "Option 1: Deploy via GitHub (Recommended)" -ForegroundColor White
Write-Host "  1. Push code to GitHub" -ForegroundColor Gray
Write-Host "  2. Connect Railway to your GitHub repo" -ForegroundColor Gray
Write-Host "  3. Railway auto-deploys on push`n" -ForegroundColor Gray

Write-Host "Option 2: Deploy via Railway CLI" -ForegroundColor White
Write-Host "  Run: railway login" -ForegroundColor Gray
Write-Host "  Run: railway init" -ForegroundColor Gray
Write-Host "  Run: railway up`n" -ForegroundColor Gray

# Ask user what they want to do
Write-Host "What would you like to do?" -ForegroundColor Cyan
Write-Host "1. Prepare for GitHub deployment (add, commit)" -ForegroundColor White
Write-Host "2. Deploy via Railway CLI now" -ForegroundColor White
Write-Host "3. Just test locally" -ForegroundColor White
Write-Host "4. Exit`n" -ForegroundColor White

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host "`n📦 Preparing for GitHub deployment..." -ForegroundColor Yellow
        
        # Add all files
        Write-Host "Adding files..." -ForegroundColor Gray
        git add .
        
        # Commit
        $commitMessage = Read-Host "Enter commit message (or press Enter for default)"
        if ([string]::IsNullOrWhiteSpace($commitMessage)) {
            $commitMessage = "Railway deployment ready - video/audio calling enabled"
        }
        
        git commit -m $commitMessage
        
        Write-Host "`n✅ Files committed!" -ForegroundColor Green
        Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
        Write-Host "1. Create a GitHub repository" -ForegroundColor White
        Write-Host "2. Run: git remote add origin <your-github-url>" -ForegroundColor White
        Write-Host "3. Run: git push -u origin main" -ForegroundColor White
        Write-Host "4. Go to railway.app and connect your repo" -ForegroundColor White
    }
    
    "2" {
        Write-Host "`n🚂 Deploying via Railway CLI..." -ForegroundColor Yellow
        
        # Login
        Write-Host "Logging in to Railway..." -ForegroundColor Gray
        railway login
        
        # Initialize
        Write-Host "`nInitializing Railway project..." -ForegroundColor Gray
        railway init
        
        # Deploy
        Write-Host "`nDeploying..." -ForegroundColor Gray
        railway up
        
        Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
        Write-Host "Check Railway dashboard for your app URL" -ForegroundColor White
    }
    
    "3" {
        Write-Host "`n🧪 Starting local test server..." -ForegroundColor Yellow
        Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Gray
        node server.js
    }
    
    "4" {
        Write-Host "`nGoodbye! 👋" -ForegroundColor Cyan
        exit
    }
    
    default {
        Write-Host "`n⚠️  Invalid choice. Exiting." -ForegroundColor Red
    }
}

Write-Host "`n✨ Done!`n" -ForegroundColor Green

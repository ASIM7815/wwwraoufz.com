# RAOUFz Chat - AWS Deployment (PowerShell)
# Run this script from your local Windows machine

Write-Host "🚀 RAOUFz Chat - AWS EC2 Deployment Helper" -ForegroundColor Cyan
Write-Host ""

# Check if AWS CLI is installed
Write-Host "Checking AWS CLI..." -ForegroundColor Yellow
$awscli = Get-Command aws -ErrorAction SilentlyContinue
if (-not $awscli) {
    Write-Host "❌ AWS CLI not found. Please install from: https://aws.amazon.com/cli/" -ForegroundColor Red
    Write-Host "Or run: choco install awscli" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ AWS CLI found" -ForegroundColor Green

# Check AWS credentials
Write-Host "Checking AWS credentials..." -ForegroundColor Yellow
try {
    aws sts get-caller-identity | Out-Null
    Write-Host "✅ AWS credentials configured" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS credentials not configured. Run: aws configure" -ForegroundColor Red
    exit 1
}

# Prompt for deployment method
Write-Host ""
Write-Host "Choose deployment method:" -ForegroundColor Cyan
Write-Host "1. Elastic Beanstalk (Recommended - Easy)"
Write-Host "2. EC2 Manual (More control)"
Write-Host "3. Lightsail (Cheapest - $3.50/month)"
Write-Host ""
$method = Read-Host "Enter choice (1-3)"

switch ($method) {
    "1" {
        Write-Host ""
        Write-Host "📦 Installing Elastic Beanstalk CLI..." -ForegroundColor Yellow
        
        # Check if pip is available
        $pip = Get-Command pip -ErrorAction SilentlyContinue
        if (-not $pip) {
            Write-Host "❌ Python/pip not found. Installing..." -ForegroundColor Red
            Write-Host "Please install Python from: https://www.python.org/downloads/" -ForegroundColor Yellow
            exit 1
        }
        
        # Install EB CLI
        pip install awsebcli --upgrade --user
        
        Write-Host ""
        Write-Host "🚀 Initializing Elastic Beanstalk..." -ForegroundColor Cyan
        
        # Initialize EB
        eb init -p node.js RAOUFz-chat --region us-east-1
        
        Write-Host ""
        Write-Host "🌐 Creating environment..." -ForegroundColor Cyan
        
        # Create environment
        eb create raoufz-chat-prod --instance-type t2.micro --envvars NODE_ENV=production
        
        Write-Host ""
        Write-Host "✅ Deployment complete!" -ForegroundColor Green
        Write-Host "Opening application..." -ForegroundColor Yellow
        
        eb open
    }
    
    "2" {
        Write-Host ""
        Write-Host "📋 EC2 Manual Deployment Steps:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Go to AWS Console → EC2 → Launch Instance"
        Write-Host "2. Choose: Ubuntu Server 22.04 LTS"
        Write-Host "3. Instance type: t2.micro (free tier)"
        Write-Host "4. Create/select key pair (save .pem file)"
        Write-Host "5. Security group: Allow ports 22, 80, 443, 3000"
        Write-Host "6. Launch instance and note the public IP"
        Write-Host ""
        
        $ip = Read-Host "Enter your EC2 public IP"
        $keyfile = Read-Host "Enter path to your .pem key file"
        
        Write-Host ""
        Write-Host "📦 Preparing deployment package..." -ForegroundColor Yellow
        
        # Create deployment archive
        $exclude = @("node_modules", ".git", "*.md")
        Compress-Archive -Path .\* -DestinationPath .\app.zip -Force
        
        Write-Host "✅ Package created: app.zip" -ForegroundColor Green
        Write-Host ""
        Write-Host "📤 Upload to EC2 using:" -ForegroundColor Yellow
        Write-Host "scp -i `"$keyfile`" app.zip ubuntu@${ip}:/home/ubuntu/" -ForegroundColor White
        Write-Host ""
        Write-Host "Then SSH and run:" -ForegroundColor Yellow
        Write-Host "ssh -i `"$keyfile`" ubuntu@$ip" -ForegroundColor White
        Write-Host "unzip app.zip -d CHEEz" -ForegroundColor White
        Write-Host "cd CHEEz" -ForegroundColor White
        Write-Host "bash deploy-aws.sh" -ForegroundColor White
    }
    
    "3" {
        Write-Host ""
        Write-Host "📋 Lightsail Deployment (Simplest):" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Go to: https://lightsail.aws.amazon.com/"
        Write-Host "2. Click 'Create instance'"
        Write-Host "3. Select: Linux/Unix → Node.js"
        Write-Host "4. Choose plan: $3.50/month (cheapest)"
        Write-Host "5. Create instance"
        Write-Host "6. Use SSH to connect and upload your app"
        Write-Host ""
        Write-Host "Then run these commands:" -ForegroundColor Yellow
        Write-Host "  cd /opt/bitnami/projects"
        Write-Host "  sudo mkdir raoufz-chat"
        Write-Host "  cd raoufz-chat"
        Write-Host "  # Upload your files here"
        Write-Host "  npm install"
        Write-Host "  pm2 start server.js"
    }
    
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📚 For detailed instructions, see: AWS-DEPLOYMENT-GUIDE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Deployment helper complete!" -ForegroundColor Green

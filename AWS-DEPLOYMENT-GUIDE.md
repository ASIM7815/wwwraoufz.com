# AWS Deployment Guide for RAOUFz Chat App

## 🚀 Deploy to AWS EC2 with Elastic Beanstalk

### Prerequisites

1. **AWS Account** - Sign up at https://aws.amazon.com
2. **AWS CLI** - Install from https://aws.amazon.com/cli/
3. **EB CLI** - Install Elastic Beanstalk CLI

### Step 1: Install AWS EB CLI

```powershell
# Install EB CLI using pip
pip install awsebcli --upgrade
```

Or using Chocolatey (Windows):
```powershell
choco install awsebcli
```

### Step 2: Configure AWS Credentials

```powershell
# Configure AWS credentials
aws configure
```

Enter:
- **AWS Access Key ID**: Your access key
- **AWS Secret Access Key**: Your secret key
- **Default region**: us-east-1 (or your preferred region)
- **Default output format**: json

### Step 3: Initialize Elastic Beanstalk

```powershell
# Navigate to your project directory
cd d:\cheeez\CHEEz

# Initialize EB
eb init
```

Configuration:
- **Region**: Select your region (e.g., us-east-1)
- **Application name**: RAOUFz-chat
- **Platform**: Node.js
- **Platform version**: Node.js 18 (or latest)
- **SSH**: Yes (for debugging)
- **Keypair**: Create new or select existing

### Step 4: Create Environment

```powershell
# Create production environment
eb create raoufz-chat-prod --instance-type t2.micro --envvars NODE_ENV=production
```

Options:
- `--instance-type t2.micro` - Free tier eligible
- `--envvars NODE_ENV=production` - Set environment variables

### Step 5: Deploy Application

```powershell
# Deploy current version
eb deploy
```

### Step 6: Open Application

```powershell
# Open in browser
eb open
```

---

## 🌐 Alternative: AWS EC2 Manual Setup

### Step 1: Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. Choose **Ubuntu Server 22.04 LTS**
3. Instance type: **t2.micro** (free tier)
4. Create/select key pair
5. Security group: Allow ports **22 (SSH)**, **80 (HTTP)**, **443 (HTTPS)**, **3000 (Node)**
6. Launch instance

### Step 2: Connect to Instance

```powershell
# SSH into instance (replace with your key and IP)
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
```

### Step 3: Install Node.js

```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 4: Install PM2

```bash
# Install PM2 (process manager)
sudo npm install -g pm2
```

### Step 5: Upload Application

**Option A: Using Git**
```bash
# Clone your repository
git clone https://github.com/ASIM7815/CHEEz.git
cd CHEEz
```

**Option B: Using SCP (from local machine)**
```powershell
# From your local machine
scp -i "your-key.pem" -r d:\cheeez\CHEEz ubuntu@your-ec2-public-ip:/home/ubuntu/
```

### Step 6: Install Dependencies

```bash
cd CHEEz
npm install
```

### Step 7: Configure Environment

```bash
# Create .env file (optional)
nano .env
```

Add:
```
PORT=3000
NODE_ENV=production
```

### Step 8: Start with PM2

```bash
# Start application
pm2 start server.js --name "raoufz-chat"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Step 9: Configure Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/raoufz-chat
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/raoufz-chat /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 10: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

Follow prompts and select redirect HTTP to HTTPS.

---

## 🔒 Important Security Notes

### 1. Update Security Group

Allow only necessary ports:
- **22** (SSH) - Your IP only
- **80** (HTTP) - 0.0.0.0/0
- **443** (HTTPS) - 0.0.0.0/0
- **3000** (Node) - Remove if using Nginx

### 2. Environment Variables

Never commit sensitive data. Use environment variables:

```bash
# Add to .env file
PORT=3000
NODE_ENV=production
```

### 3. Enable HTTPS

Your E2E encryption works over HTTP, but HTTPS adds transport layer security:
- Use Let's Encrypt (free SSL)
- Required for production

---

## 📊 Cost Estimate (AWS)

### Free Tier (First 12 months):
- **EC2 t2.micro**: 750 hours/month (free)
- **Data Transfer**: 15 GB/month (free)
- **Elastic Beanstalk**: No additional charge

### After Free Tier:
- **EC2 t2.micro**: ~$8-10/month
- **Data Transfer**: $0.09/GB after 1 GB
- **Total**: ~$10-15/month for small app

---

## 🔧 Useful Commands

### Elastic Beanstalk:
```powershell
eb status              # Check environment status
eb logs                # View logs
eb ssh                 # SSH into instance
eb terminate           # Terminate environment
```

### PM2:
```bash
pm2 list               # List running processes
pm2 logs               # View logs
pm2 restart all        # Restart all apps
pm2 stop all           # Stop all apps
pm2 delete all         # Delete all apps
```

### Nginx:
```bash
sudo systemctl status nginx    # Check status
sudo systemctl restart nginx   # Restart
sudo nginx -t                  # Test configuration
```

---

## 🌐 Alternative: AWS Lightsail (Simpler)

### Cheapest AWS Option ($3.50/month)

1. Go to AWS Lightsail
2. Create instance → Node.js
3. Upload your code
4. Configure firewall (ports 80, 443, 3000)
5. Assign static IP
6. Point domain to IP

**Simpler** than EC2 but less flexible.

---

## 🚀 Quick Deploy (One-Line)

If you want automated deployment, use this:

```powershell
# Install EB CLI
pip install awsebcli

# Initialize and deploy
eb init -p node.js RAOUFz-chat --region us-east-1
eb create raoufz-prod
eb open
```

---

## 📝 Post-Deployment Checklist

- [ ] Application accessible at public URL
- [ ] WebSocket connections working
- [ ] E2E encryption active (check console)
- [ ] Video/audio calls working
- [ ] HTTPS enabled (SSL certificate)
- [ ] Firewall configured
- [ ] PM2 running and auto-restart enabled
- [ ] Domain name pointed to instance (optional)
- [ ] Monitoring enabled
- [ ] Backups configured (optional)

---

## 🔍 Troubleshooting

### WebSocket not connecting:
- Check security group allows all ports
- Ensure Nginx has WebSocket proxy headers
- Verify Socket.IO CORS configuration

### SSL issues:
```bash
# Renew certificate
sudo certbot renew
```

### App crashes:
```bash
# Check PM2 logs
pm2 logs

# Restart app
pm2 restart all
```

### Port already in use:
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

---

## 📞 Need Help?

Common issues:
1. **WebSocket not working** - Check CORS and proxy settings
2. **SSL certificate** - Use Let's Encrypt (free)
3. **Performance** - Upgrade instance type
4. **Domain** - Use Route 53 or external DNS

**Your app will be live at:** `http://your-ec2-ip:3000` or `https://your-domain.com`

---

## 🎉 Next Steps

After deployment:
1. Test E2E encryption
2. Share URL with users
3. Monitor performance
4. Setup custom domain (optional)
5. Enable CloudWatch monitoring

**Your secure chat app is ready for the world! 🚀**

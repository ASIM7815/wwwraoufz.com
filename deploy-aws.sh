#!/bin/bash

# RAOUFz Chat - AWS Deployment Script
# Run this on your EC2 instance after SSH

echo "🚀 Starting RAOUFz Chat Deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Navigate to app directory
cd /home/ubuntu/CHEEz || exit

# Install dependencies
echo "📦 Installing application dependencies..."
npm install

# Create .env file
echo "📝 Creating environment file..."
cat > .env << EOF
PORT=3000
NODE_ENV=production
EOF

# Start application with PM2
echo "🚀 Starting application..."
pm2 start server.js --name "raoufz-chat"
pm2 save

# Setup PM2 to start on boot
echo "⚙️ Configuring PM2 startup..."
pm2 startup | tail -n 1 | bash

# Install and configure Nginx
echo "📦 Installing Nginx..."
sudo apt install nginx -y

# Create Nginx configuration
echo "⚙️ Configuring Nginx..."
sudo tee /etc/nginx/sites-available/raoufz-chat > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

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
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/raoufz-chat /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Display status
echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📊 Application Status:"
pm2 status
echo ""
echo "🌐 Access your app at: http://$(curl -s ifconfig.me)"
echo ""
echo "📝 Useful Commands:"
echo "  pm2 logs          - View logs"
echo "  pm2 restart all   - Restart app"
echo "  pm2 stop all      - Stop app"
echo ""
echo "🔒 To enable HTTPS:"
echo "  sudo apt install certbot python3-certbot-nginx -y"
echo "  sudo certbot --nginx -d your-domain.com"
echo ""

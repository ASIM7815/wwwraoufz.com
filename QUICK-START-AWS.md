# 🚀 Quick Start: Deploy to AWS

## Option 1: Easiest - Elastic Beanstalk (Recommended)

### Prerequisites:
- AWS Account
- Python installed

### Steps:

```powershell
# 1. Install EB CLI
pip install awsebcli --upgrade

# 2. Configure AWS (if not done)
aws configure

# 3. Run deployment script
.\deploy-aws.ps1
```

Choose option **1** when prompted.

**Time:** 5-10 minutes  
**Cost:** Free tier / $10-15/month after  
**Difficulty:** Easy ⭐

---

## Option 2: Manual - EC2 Instance

### Steps:

1. **Launch EC2 Instance**
   - Go to AWS Console → EC2
   - Click "Launch Instance"
   - Choose: Ubuntu Server 22.04 LTS
   - Instance type: t2.micro (free tier)
   - Create key pair (download .pem file)
   - Security group: Allow ports 22, 80, 443, 3000
   - Launch instance

2. **Get Instance IP**
   - Note your public IP address

3. **Upload Application**
   ```powershell
   # From your local machine
   scp -i "your-key.pem" -r d:\cheeez\CHEEz ubuntu@YOUR-IP:/home/ubuntu/
   ```

4. **SSH into Instance**
   ```powershell
   ssh -i "your-key.pem" ubuntu@YOUR-IP
   ```

5. **Run Deployment Script**
   ```bash
   cd CHEEz
   bash deploy-aws.sh
   ```

6. **Access Your App**
   - Open browser: `http://YOUR-IP`

**Time:** 15-20 minutes  
**Cost:** Free tier / $10/month after  
**Difficulty:** Medium ⭐⭐

---

## Option 3: Cheapest - Lightsail

### Steps:

1. Go to: https://lightsail.aws.amazon.com/
2. Click "Create instance"
3. Select: Linux/Unix → Node.js
4. Choose plan: **$3.50/month**
5. Create instance
6. Use SSH button to connect
7. Upload and run your app

**Time:** 10 minutes  
**Cost:** $3.50/month  
**Difficulty:** Easy ⭐

---

## 🔍 Which Option to Choose?

| Option | Cost | Ease | Best For |
|--------|------|------|----------|
| **Elastic Beanstalk** | $10-15/mo | ⭐ Easy | Production apps |
| **EC2 Manual** | $10/mo | ⭐⭐ Medium | Full control |
| **Lightsail** | $3.50/mo | ⭐ Easy | Testing/small apps |

---

## ✅ After Deployment

1. **Test your app** at the provided URL
2. **Enable HTTPS** (recommended):
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```
3. **Test E2E encryption** - Look for 🔒 padlock in chat
4. **Share with users!**

---

## 🆘 Quick Troubleshooting

### App not loading?
- Check security group allows port 3000 or 80
- Run: `pm2 logs` on server

### WebSocket not connecting?
- Add WebSocket proxy headers to Nginx
- Check CORS settings

### Need SSL?
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx
```

---

## 📞 Support

See detailed guide: **AWS-DEPLOYMENT-GUIDE.md**

**Your encrypted chat app will be live in under 10 minutes! 🎉**

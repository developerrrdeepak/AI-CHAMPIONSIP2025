# HireVision Deployment Guide

This guide covers deploying HireVision to production using Vercel, Docker, or traditional servers.

## Prerequisites

- Node.js 20+
- npm or yarn
- Git repository (for CI/CD)
- All required API keys configured

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

#### Setup

1. **Connect GitHub Repository**
   ```bash
   # Push code to GitHub
   git add .
   git commit -m "Production deployment"
   git push origin main
   ```

2. **Import Project to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository

3. **Configure Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add all required env vars from `.env.example`:
     - Firebase credentials
     - Raindrop API key
     - Vultr credentials
     - Stripe keys
     - ElevenLabs API key
     - Google Genkit API key

4. **Deploy**
   - Vercel automatically deploys on `git push` to main
   - Monitor build progress in Vercel dashboard
   - Check deployment logs for errors

#### Configure Stripe Webhook

1. In Stripe Dashboard:
   - Go to Webhooks
   - Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
   - Select events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
   - Get webhook signing secret

2. In Vercel:
   - Add `STRIPE_WEBHOOK_SECRET` environment variable

### Option 2: Docker Deployment

#### Build Docker Image

```bash
# Build image
docker build -t hirevision:latest .

# Or with build args
docker build -t hirevision:latest \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id \
  .
```

#### Run with Docker Compose

```bash
# Copy and configure environment
cp .env.example .env.local

# Start services (includes PostgreSQL)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

#### Deploy to Docker Registry

```bash
# Tag image
docker tag hirevision:latest your-registry/hirevision:latest

# Push to registry
docker push your-registry/hirevision:latest

# Pull and run on server
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e STRIPE_SECRET_KEY=... \
  your-registry/hirevision:latest
```

### Option 3: Traditional Server Deployment

#### On Ubuntu/Debian Server

1. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -sL https://deb.nodesource.com/setup_20.x | sudo bash -
   sudo apt install -y nodejs npm
   
   # Install PostgreSQL (if using)
   sudo apt install -y postgresql postgresql-contrib
   
   # Install PM2 process manager
   sudo npm install -g pm2
   ```

2. **Clone Repository**
   ```bash
   cd /opt
   git clone https://github.com/your-org/hirevision.git
   cd hirevision
   ```

3. **Install Application Dependencies**
   ```bash
   npm ci --production
   ```

4. **Build Application**
   ```bash
   npm run build
   ```

5. **Configure Environment**
   ```bash
   cp .env.example .env.production
   # Edit .env.production with actual values
   nano .env.production
   ```

6. **Start Application with PM2**
   ```bash
   pm2 start npm --name "hirevision" -- start
   pm2 save
   pm2 startup
   ```

7. **Configure Reverse Proxy (Nginx)**
   ```bash
   sudo apt install -y nginx
   sudo nano /etc/nginx/sites-available/hirevision
   ```
   
   Add configuration:
   ```nginx
   upstream hirevision_backend {
     server 127.0.0.1:3000;
   }
   
   server {
     listen 80;
     server_name yourdomain.com;
   
     location / {
       proxy_pass http://hirevision_backend;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }
   }
   ```
   
   ```bash
   sudo ln -s /etc/nginx/sites-available/hirevision /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

## CI/CD Pipeline Setup

### GitHub Actions

1. **Create Secrets in GitHub**
   - Go to Settings → Secrets and Variables → Actions
   - Add all environment variables as secrets

2. **Secrets Required**
   ```
   VERCEL_TOKEN
   VERCEL_ORG_ID
   VERCEL_PROJECT_ID
   NEXT_PUBLIC_FIREBASE_API_KEY
   ... (all other env vars)
   ```

3. **Deploy Workflow**
   - Automatic on push to main branch
   - Runs linting, tests, build
   - Deploys to Vercel if all checks pass

## Database Setup

### Vultr PostgreSQL

1. **Create PostgreSQL Database**
   - Log in to Vultr console
   - Create Managed Database (PostgreSQL 15)
   - Get connection string

2. **Migrate Database**
   ```bash
   export DATABASE_URL="postgresql://user:pass@host:5432/db"
   npm run db:migrate
   ```

3. **Seed Data**
   ```bash
   npm run db:seed
   ```

## Health Checks

### Verify Deployment

```bash
# Check app is running
curl https://yourdomain.com

# Check API endpoints
curl https://yourdomain.com/api/health

# Check Stripe webhook
curl -X POST https://yourdomain.com/api/stripe/webhook \
  -H "stripe-signature: test" \
  -d '{}'
```

### Monitoring

1. **Vercel Analytics**
   - Dashboard shows real-time metrics
   - Automatic error tracking
   - Performance insights

2. **Application Logging**
   ```bash
   # View PM2 logs
   pm2 logs hirevision
   
   # View Docker logs
   docker logs container_id
   ```

3. **Error Tracking**
   - Set up Sentry for error monitoring
   - Configure in `.env` and error boundary

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm ci
npm run build
```

### Environment Variables Missing

```bash
# Verify all vars set
env | grep -E "^(NEXT_|STRIPE|ELEVENLABS|RAINDROP|VULTR|GOOGLE)"
```

### Database Connection Issues

```bash
# Test connection
psql postgresql://user:pass@host:5432/db -c "SELECT 1"
```

### Stripe Webhook Not Working

1. Verify webhook secret configured
2. Check webhook signature verification
3. View webhook attempts in Stripe dashboard

## Rollback Procedure

### Vercel

```bash
# View deployment history
vercel deployments list

# Promote previous deployment
vercel promote <deployment-id>
```

### Manual Servers

```bash
# Rollback to previous version
pm2 restart hirevision

# Or, revert commits
git revert <commit-hash>
git push origin main
npm run build
pm2 restart hirevision
```

## Performance Optimization

### Caching

- Vercel automatically caches static assets
- Configure Next.js image optimization
- Enable gzip compression

### Database

- Create indexes for frequent queries
- Archive old data
- Use connection pooling

### CDN

- Use Vercel's global CDN (included)
- Or configure Cloudflare for edge caching

## Security Checklist

- [ ] All secrets in environment variables (not in code)
- [ ] HTTPS enabled
- [ ] Firewall rules configured
- [ ] Database backups enabled
- [ ] API rate limiting configured
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] Regular security updates

## Support

For issues:
1. Check deployment logs
2. Review error messages in Vercel dashboard
3. Verify environment variables
4. Check API endpoints with curl
5. Review application logs
6. Contact support with logs and error details

---

**Ready to deploy!** Choose your option above and follow the steps.

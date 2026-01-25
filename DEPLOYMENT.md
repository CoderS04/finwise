# Quick Production Deployment Guide

## Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All tests passing locally
- [ ] Code committed to git
- [ ] Production database provisioned and tested
- [ ] Production SECRET_KEY generated
- [ ] Production domains/URLs finalized
- [ ] SSL/TLS certificate ready

## Generate Secure SECRET_KEY

```bash
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"
```

Copy the output to production `.env`

## Option 1: Render.com Deployment

### 1. Connect Git Repository

1. Go to [render.com](https://render.com)
2. Create new account or login
3. Click "New" → "Web Service"
4. Connect GitHub repository
5. Choose `release-v1` branch

### 2. Configure Backend Service

- **Name**: `finwise-api`
- **Runtime**: Python
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 3. Add Environment Variables

In Render dashboard, add:

```
APP_NAME=Finwise
SECRET_KEY=<your-generated-secret-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=postgresql://user:pass@host:5432/finwise?sslmode=require
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
ENVIRONMENT=production
```

### 4. Connect PostgreSQL

1. In Render, create new PostgreSQL database
2. Copy connection string to `DATABASE_URL` above
3. Wait for database to initialize

### 5. Deploy Frontend

1. Create new Static Site service
2. Connect same GitHub repo
3. **Build Command**: `cd frontend && npm install && npm run build`
4. **Publish Directory**: `frontend/dist`
5. Add environment variable:
   ```
   VITE_API_BASE_URL=https://finwise-api.onrender.com
   ```

### 6. Update DNS/Domain

Update your domain's DNS records to point to Render:
- Create CNAME record pointing to Render URL
- Update frontend environment variable if using custom domain

## Option 2: Railway Deployment

### 1. Connect Git Repository

1. Go to [railway.app](https://railway.app)
2. Create account or login
3. Click "New Project"
4. Select "Deploy from GitHub"
5. Connect repository

### 2. Configure Backend

1. Create new service from `backend` directory
2. Set environment variables (same as Render above)
3. Set start command in `Procfile`:
   ```
   web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

### 3. Add PostgreSQL

1. Add PostgreSQL plugin
2. Copy connection string to `DATABASE_URL`

### 4. Configure Frontend

1. Create separate service from `frontend` directory
2. Build command: `npm install && npm run build`
3. Start command: `npm run preview`
4. Environment: `VITE_API_BASE_URL=<your-backend-url>`

## Option 3: Heroku Deployment (Legacy)

### 1. Install Heroku CLI

```bash
npm install -g heroku
heroku login
```

### 2. Create App and Database

```bash
heroku create finwise-api
heroku addons:create heroku-postgresql:hobby-dev

# Get DATABASE_URL
heroku config:get DATABASE_URL
```

### 3. Set Environment Variables

```bash
heroku config:set SECRET_KEY="<your-generated-key>"
heroku config:set ENVIRONMENT="production"
heroku config:set ALLOWED_ORIGINS="https://yourdomain.com"
```

### 4. Deploy Backend

```bash
git push heroku main
```

### 5. Deploy Frontend

For frontend, use Vercel or Netlify instead (simpler static hosting).

## Post-Deployment Verification

### 1. Test API Health

```bash
curl https://your-api-domain/health
# Should return: {"status":"ok"}
```

### 2. Test Authentication

```bash
# Register
curl -X POST https://your-api-domain/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'

# Login
curl -X POST https://your-api-domain/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'
```

### 3. Verify CORS

```bash
curl -I https://your-api-domain \
  -H "Origin: https://yourdomain.com"
# Should include Access-Control-Allow-Origin header
```

### 4. Test Database Connection

Frontend should load without errors and be able to:
- Register new user
- Login successfully
- Create account
- See dashboard

## Common Issues & Solutions

### "Refused to connect" from frontend
- Check VITE_API_BASE_URL matches backend domain
- Check ALLOWED_ORIGINS includes frontend domain
- Check SSL certificates are valid

### Database connection refused
- Verify DATABASE_URL is correct
- Check database service is running
- Verify firewall allows connection from application server

### "Invalid token" errors
- Verify SECRET_KEY is the same on all instances
- Check token expiration time is reasonable
- Ensure clock sync between services

### Slow performance
- Check database indexes
- Monitor resource usage (CPU, memory, disk)
- Consider upgrading database plan
- Enable caching if available

## Monitoring & Logs

### View Logs

**Render**:
```bash
# In dashboard, click service → Logs
# Or use CLI:
# (Not available in free tier, use dashboard)
```

**Railway**:
```bash
# In dashboard, click service → Logs
```

**Heroku**:
```bash
heroku logs --tail
```

### Set Up Error Monitoring

Recommended services:
- **Sentry** (error tracking)
- **Datadog** (full monitoring)
- **New Relic** (APM)

Example Sentry integration:
```python
# In main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

if settings.is_production():
    sentry_sdk.init(
        dsn="your-sentry-dsn",
        integrations=[FastApiIntegration()],
        traces_sample_rate=0.1
    )
```

## Rollback Procedure

If something goes wrong:

1. **Check recent changes**
   - Review git log
   - Check environment variable changes

2. **Rollback code**
   - Redeploy previous commit
   - Or manually revert changes

3. **Rollback database (if needed)**
   - Restore from backup
   - Verify data integrity

4. **Verify services**
   - Test health endpoint
   - Test authentication
   - Check frontend connectivity

## Next Steps

1. Domain/DNS configuration
2. HTTPS certificate renewal automation (Let's Encrypt)
3. Set up automated backups
4. Configure monitoring and alerting
5. Document runbooks for common issues
6. Plan disaster recovery procedures
7. Security audit and penetration testing

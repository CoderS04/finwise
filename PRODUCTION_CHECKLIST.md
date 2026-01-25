# Production Deployment Security Checklist

## Environment Configuration

### Backend (.env in production)
- [ ] **DATABASE_URL**: Set to production PostgreSQL instance (not localhost)
  - Use managed database service (AWS RDS, Render, Railway, etc.)
  - Format: `postgresql://username:password@db-host.region.rds.amazonaws.com:5432/finwise`
  - Never use admin credentials; create restricted database user
  - Enable SSL/TLS for database connections

- [ ] **SECRET_KEY**: Generate cryptographically secure random key (minimum 32 characters)
  ```bash
  # Generate a secure key:
  python -c "import secrets; print(secrets.token_urlsafe(32))"
  ```
  - Store in environment variable, NEVER commit to git
  - Use secrets management (AWS Secrets Manager, HashiCorp Vault, etc.)

- [ ] **ENVIRONMENT**: Set to `production`

- [ ] **ALLOWED_ORIGINS**: Update CORS to production domains only
  - Format: `https://yourdomain.com,https://app.yourdomain.com`
  - Remove localhost origins
  - Use HTTPS URLs only in production

### Frontend (.env in production)
- [ ] **VITE_API_BASE_URL**: Set to production API domain
  - Format: `https://api.yourdomain.com` or `https://yourdomain.com/api`
  - Must be HTTPS in production
  - Must match ALLOWED_ORIGINS on backend

## Database Security

- [ ] Use production-grade PostgreSQL instance
  - [ ] Enable automated backups
  - [ ] Enable SSL/TLS for all connections
  - [ ] Restrict database access to application server IP only
  - [ ] Use strong, randomly generated database password
  - [ ] Create non-admin database user for application

- [ ] Database user permissions (principle of least privilege)
  - [ ] SELECT, INSERT, UPDATE, DELETE on application tables
  - [ ] No CREATE/DROP/ALTER permissions
  - [ ] No superuser/admin roles

- [ ] Database monitoring
  - [ ] Enable query logging for suspicious activity
  - [ ] Set up alerts for failed connection attempts
  - [ ] Regular backup verification and restore testing

## API Security

- [ ] **HTTPS Only**
  - [ ] SSL/TLS certificate (use Let's Encrypt or AWS ACM for free)
  - [ ] Redirect HTTP to HTTPS
  - [ ] Set HSTS header (Strict-Transport-Security)

- [ ] **Authentication & Authorization**
  - [ ] JWT SECRET_KEY is cryptographically secure
  - [ ] Token expiration is set (30 minutes recommended)
  - [ ] Password validation enforced:
    - [ ] Minimum 8 characters
    - [ ] Uppercase letter required
    - [ ] Lowercase letter required
    - [ ] Digit required
    - [ ] Special character required

- [ ] **CORS Protection**
  - [ ] Wildcard `*` origins removed
  - [ ] Only specified production domains allowed
  - [ ] Credentials only sent to trusted origins

- [ ] **Rate Limiting** (recommended)
  - [ ] Implement rate limiting on `/auth/login` endpoint
  - [ ] Implement rate limiting on `/auth/register` endpoint
  - [ ] Consider IP-based rate limiting for DDoS protection

## Security Headers

- [ ] Add security headers in production
  ```python
  # In main.py middleware:
  @app.middleware("http")
  async def add_security_headers(request: Request, call_next):
      response = await call_next(request)
      response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
      response.headers["X-Content-Type-Options"] = "nosniff"
      response.headers["X-Frame-Options"] = "DENY"
      response.headers["X-XSS-Protection"] = "1; mode=block"
      return response
  ```

## Secrets Management

- [ ] Never commit `.env` files to git
  - [ ] Add `.env` and `.env*.local` to `.gitignore`
  - [ ] Use `.env.production` as template only
  - [ ] Rotate secrets regularly

- [ ] Use environment variables, not config files
  - [ ] Set via deployment platform (Render, Heroku, Docker, etc.)
  - [ ] Use secrets manager for sensitive data
  - [ ] Audit access to secrets

## Logging & Monitoring

- [ ] Remove sensitive information from logs
  - [ ] Don't log DATABASE_URL, SECRET_KEY, passwords, tokens
  - [ ] Current code: ✓ Database URL logging removed

- [ ] Enable application monitoring
  - [ ] Error tracking (Sentry, Rollbar, etc.)
  - [ ] Performance monitoring (New Relic, DataDog, etc.)
  - [ ] Request logging for audit trail

- [ ] Database activity monitoring
  - [ ] Log slow queries
  - [ ] Monitor for unusual access patterns
  - [ ] Set up alerts for suspicious activity

## Deployment

- [ ] Use production-grade hosting
  - [ ] Render, Railway, Heroku, AWS, Google Cloud, Azure, etc.
  - [ ] Auto-scaling enabled for traffic spikes
  - [ ] Load balancing for high availability

- [ ] Infrastructure security
  - [ ] Database and API in private networks/VPCs
  - [ ] Use API Gateway or Reverse Proxy (nginx, etc.)
  - [ ] Enable DDoS protection
  - [ ] Regular security patches and updates

- [ ] CI/CD Security
  - [ ] Secrets never exposed in CI/CD logs
  - [ ] Code scanning for vulnerabilities
  - [ ] Automated tests in deployment pipeline
  - [ ] Manual approval for production deployments

## Post-Deployment

- [ ] Verify production configuration
  - [ ] Test API with production database
  - [ ] Verify CORS restrictions are working
  - [ ] Confirm HTTPS is enforced
  - [ ] Check that localhost endpoints are not accessible

- [ ] Security Testing
  - [ ] Penetration testing
  - [ ] OWASP Top 10 vulnerability scan
  - [ ] Load testing for performance under attack

- [ ] Incident Response Plan
  - [ ] Document security incident procedures
  - [ ] Set up on-call rotation
  - [ ] Prepare incident communication plan
  - [ ] Regular security audits

## Current Status

### ✅ Fixed Issues
- [x] Database configuration uses environment variables
- [x] CORS configuration is now customizable per environment
- [x] Sensitive data (DATABASE_URL) no longer logged
- [x] Password validation enforced
- [x] JWT token validation robust
- [x] Email addresses normalized (case-insensitive)
- [x] User active status checked

### ⚠️ Remaining Production Tasks
- [ ] Generate and set production SECRET_KEY
- [ ] Configure production PostgreSQL database
- [ ] Deploy to production hosting (Render, Railway, etc.)
- [ ] Enable HTTPS/SSL certificate
- [ ] Update ALLOWED_ORIGINS for production domain
- [ ] Update VITE_API_BASE_URL for production domain
- [ ] Set ENVIRONMENT=production in production
- [ ] Add rate limiting middleware
- [ ] Add security headers middleware
- [ ] Set up monitoring and alerting
- [ ] Perform security testing

## Quick Production Setup

```bash
# 1. Generate secure SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# 2. Copy template to production
cp .env.production .env

# 3. Edit .env with production values
# - DATABASE_URL: Your production database
# - SECRET_KEY: Generated secure key
# - ALLOWED_ORIGINS: Your production domains

# 4. For frontend, create .env for production build
# - VITE_API_BASE_URL: Your production API URL

# 5. Deploy to production platform with environment variables
```

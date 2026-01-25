# Database Setup Guide

## Local Development Setup

### Create PostgreSQL Database

```bash
# Using psql
psql -U postgres

# Create database
CREATE DATABASE finwise;

# Create user with restricted permissions
CREATE USER finwise_user WITH PASSWORD 'your-secure-password';

# Grant permissions
ALTER ROLE finwise_user SET client_encoding TO 'utf8';
ALTER ROLE finwise_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE finwise_user SET default_transaction_deferrable TO on;
ALTER ROLE finwise_user SET default_transaction_read_committed TO on;
GRANT ALL PRIVILEGES ON DATABASE finwise TO finwise_user;

# Exit psql
\q
```

### Connect from Application

Update `.env`:
```dotenv
DATABASE_URL=postgresql://finwise_user:your-secure-password@localhost:5432/finwise
```

## Production Database Setup

### Option 1: AWS RDS PostgreSQL

1. Create RDS instance via AWS Console
2. Database identifier: `finwise-db`
3. Master username: `postgres`
4. Master password: Generate secure password
5. DB instance class: `db.t3.micro` (free tier eligible)
6. Storage: 20 GB GP2
7. Enable storage autoscaling
8. VPC security: Restrict inbound to application security group only
9. Backup: Enable automated backups (7 days)
10. Enable enhanced monitoring

Connection string format:
```
postgresql://postgres:password@finwise-db.xxxxx.us-east-1.rds.amazonaws.com:5432/finwise
```

### Option 2: Render PostgreSQL

1. Go to render.com dashboard
2. Create new PostgreSQL database
3. Name: `finwise-db`
4. Plan: Starter (free)
5. Copy connection string from dashboard
6. Add to production `.env`

Connection string format:
```
postgresql://user:password@dpg-xxxxx-a.oregon-postgres.render.com:5432/finwise
```

### Option 3: Railway PostgreSQL

1. Go to railway.app
2. Create new project
3. Add PostgreSQL
4. Copy connection string
5. Add to production environment

Connection string format:
```
postgresql://postgres:password@postgres.railway.internal:5432/finwise
```

## Production Database Configuration

### Security Best Practices

1. **Create restricted database user** (NOT admin)
   ```sql
   -- Connect as admin
   psql -U postgres -h your-db-host -d finwise
   
   -- Create application user
   CREATE USER finwise_app WITH PASSWORD 'generate-secure-random-password';
   
   -- Grant only necessary permissions
   GRANT CONNECT ON DATABASE finwise TO finwise_app;
   GRANT USAGE ON SCHEMA public TO finwise_app;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO finwise_app;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO finwise_app;
   ```

2. **Enable SSL/TLS**
   - Most managed services (RDS, Render, Railway) enforce SSL by default
   - Connection strings may need `?sslmode=require` parameter

3. **Enable automated backups**
   - Daily backups minimum
   - Retain for 7-30 days
   - Test restore procedures regularly

4. **Network Security**
   - Database accessible only from application servers
   - Use private VPCs/networks when available
   - Whitelist application server IP

5. **Monitoring & Logging**
   - Enable query logging for slow queries (>1 second)
   - Monitor connection count
   - Set up alerts for unusual activity

## Database Schema

The application uses SQLAlchemy ORM with automatic table creation.

Tables created on first startup:
- `users` - User authentication and profiles
- `accounts` - User bank/wallet accounts
- `categories` - Transaction categories
- `transactions` - User transactions
- `budgets` - User budgets
- `goals` - User financial goals

### Table Relationships

```
users (1) ──→ (many) accounts
users (1) ──→ (many) transactions
users (1) ──→ (many) budgets
users (1) ──→ (many) goals
accounts (1) ──→ (many) transactions
categories (1) ──→ (many) transactions
budgets (1) ──→ (many) transactions
```

## Backup & Recovery

### Automated Backups

Production databases should have:
- Daily automated backups
- Point-in-time recovery enabled
- Backups stored in separate region/availability zone

### Manual Backup (PostgreSQL)

```bash
# Backup database
pg_dump -U username -h db-host -d finwise > finwise-backup-$(date +%Y%m%d).sql

# Backup database (compressed)
pg_dump -U username -h db-host -d finwise | gzip > finwise-backup-$(date +%Y%m%d).sql.gz

# Restore from backup
psql -U username -h db-host -d finwise < finwise-backup-20260125.sql
```

### Testing Recovery

- Monthly: Restore backup to test database
- Verify data integrity
- Document time to recovery
- Update runbooks based on findings

## Migration Strategy

When deploying new schema changes:

1. **Development**: Test migrations locally
2. **Staging**: Run migrations on staging database first
3. **Production**: Plan maintenance window if needed
   - Most schema additions don't require downtime
   - Some operations (like adding NOT NULL columns) require special handling
   - Use zero-downtime migration techniques when possible

4. **Rollback Plan**: Keep backup before any schema change

## Monitoring Checklist

- [ ] Database CPU usage < 80%
- [ ] Memory usage < 80%
- [ ] Storage usage < 80%
- [ ] Slow query log monitored
- [ ] Connection pool not saturated
- [ ] Replication lag (if applicable) < 1 second
- [ ] Backup completion verified daily

## Environment Variables

### Development (.env)
```dotenv
DATABASE_URL=postgresql://postgres:admin@localhost:5432/finwise
ENVIRONMENT=development
```

### Production (.env)
```dotenv
DATABASE_URL=postgresql://finwise_app:secure-password@finwise-db.xxxxx.us-east-1.rds.amazonaws.com:5432/finwise?sslmode=require
ENVIRONMENT=production
```

## Troubleshooting

### Connection refused
- Check database is running
- Verify host/port/database name
- Check firewall rules
- Verify username/password

### "too many connections"
- Increase max_connections setting
- Check for connection leaks in application
- Restart connection pool

### Slow queries
- Check indexes on frequently queried columns
- Enable query logging
- Analyze query execution plans with EXPLAIN

### Disk space full
- Check and clean up old logs
- Archive historical data
- Increase storage size
- Optimize indexes

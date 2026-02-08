# Finzo Deployment Examples

Quick reference for deploying Finzo with OpenAI in production environments.

---

## Docker Deployment

### Dockerfile (Production)
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY backend/app ./app

# Environment variables (passed at runtime)
ENV LLM_PROVIDER=openai
ENV PYTHONUNBUFFERED=1

# Start server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose with Secrets
```yaml
version: '3.8'

services:
  finzo-backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    environment:
      LLM_PROVIDER: openai
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      DATABASE_URL: postgresql://user:${DB_PASSWORD}@db:5432/finwise
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
    ports:
      - "8000:8000"
    depends_on:
      - db
    
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: finwise
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```

### Run with Docker
```bash
# Create .env file with secrets
cat > .env << EOF
OPENAI_API_KEY=sk-proj-your-key-here
DATABASE_URL=postgresql://user:password@db:5432/finwise
JWT_SECRET_KEY=your-secret-key
DB_PASSWORD=your-db-password
EOF

# Build and run
docker-compose up --build
```

---

## Kubernetes Deployment

### secrets.yaml
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: finzo-secrets
type: Opaque
stringData:
  openai-api-key: sk-proj-your-actual-key-here
  jwt-secret-key: your-secret-key-here
  db-password: your-db-password
```

### deployment.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: finzo-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: finzo
  template:
    metadata:
      labels:
        app: finzo
    spec:
      containers:
      - name: finzo
        image: your-registry/finzo:latest
        ports:
        - containerPort: 8000
        env:
        - name: LLM_PROVIDER
          value: "openai"
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: finzo-secrets
              key: openai-api-key
        - name: JWT_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: finzo-secrets
              key: jwt-secret-key
        - name: DATABASE_URL
          value: "postgresql://user:$(DB_PASSWORD)@postgres:5432/finwise"
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: finzo-secrets
              key: db-password
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
```

### Deploy to Kubernetes
```bash
# Create secrets
kubectl apply -f secrets.yaml

# Deploy
kubectl apply -f deployment.yaml

# Verify
kubectl get pods -l app=finzo
```

---

## AWS Lambda (Serverless)

### serverless.yml
```yaml
service: finzo-api

frameworkVersion: '3'

provider:
  name: aws
  runtime: python3.11
  region: us-east-1
  environment:
    LLM_PROVIDER: openai
    OPENAI_API_KEY: ${ssm:/finzo/openai-api-key}
    DATABASE_URL: ${ssm:/finzo/database-url}
    JWT_SECRET_KEY: ${ssm:/finzo/jwt-secret}

functions:
  api:
    handler: app.main.app
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
    memorySize: 512
    timeout: 30

plugins:
  - serverless-python-requirements

custom:
  pythonRequirements:
    dockerizePip: true
    layer: true
```

### Deploy to AWS Lambda
```bash
# Install serverless
npm install -g serverless

# Deploy
serverless deploy

# View logs
serverless logs -f api
```

---

## Heroku Deployment

### Procfile
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Deploy
```bash
# Login to Heroku
heroku login

# Create app
heroku create finzo-api

# Set environment variables
heroku config:set LLM_PROVIDER=openai
heroku config:set OPENAI_API_KEY=sk-proj-your-key-here
heroku config:set DATABASE_URL=postgresql://...
heroku config:set JWT_SECRET_KEY=your-secret-key

# Deploy from Git
git push heroku main

# View logs
heroku logs --tail
```

---

## Environment Variable Checklist

Before deploying to production, ensure you have:

- [ ] `LLM_PROVIDER=openai`
- [ ] `OPENAI_API_KEY=sk-proj-...` (from OpenAI dashboard)
- [ ] `DATABASE_URL=postgresql://...` (production database)
- [ ] `JWT_SECRET_KEY=...` (strong random string)
- [ ] `JWT_ALGORITHM=HS256`
- [ ] `JWT_EXPIRATION_MINUTES=15`
- [ ] `DEBUG=false`
- [ ] `ENVIRONMENT=production`

---

## Cost Monitoring

### Track OpenAI Usage
```bash
# Get API usage (requires OpenAI CLI)
openai api usage --start-date 2024-02-01

# Or check dashboard: https://platform.openai.com/account/billing/overview
```

### Set Budget Alerts (AWS Example)
```bash
# Limit spending to $100/month
aws budgets create-budget \
  --account-id 123456789 \
  --budget '{"BudgetName":"FinzoOpenAI","BudgetLimit":{"Amount":"100","Unit":"USD"}}'
```

---

## Rollback Plan

If OpenAI service becomes unavailable:

1. **Quick Fix**: Set `LLM_PROVIDER=ollama` and point to a fallback service
2. **Fallback Response**: Users see "I'm temporarily unable..." message
3. **Graceful Degradation**: App continues working without chat features

```bash
# Emergency rollback
heroku config:set LLM_PROVIDER=ollama
heroku config:set OLLAMA_BASE_URL=https://ollama-fallback.example.com
```

---

## Performance Tips

1. **Increase timeout for large contexts**: Adjust `REQUEST_TIMEOUT` in llm_client.py
2. **Cache chat responses**: Implement response caching for identical prompts
3. **Batch requests**: Process multiple chat requests asynchronously
4. **Monitor latency**: OpenAI typically responds in 1-3 seconds

---

## Support & Troubleshooting

- **OpenAI API Issues**: https://status.openai.com
- **Rate Limiting**: Implement backoff strategy (exponential backoff recommended)
- **Cost Overages**: Set spending limits in OpenAI dashboard
- **Logs**: Check deployment platform logs for detailed errors

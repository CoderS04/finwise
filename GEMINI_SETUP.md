# Google Gemini API Setup for Finzo

## Overview

Google Gemini offers a powerful, cost-effective alternative for production deployment with a generous free tier and competitive paid pricing.

---

## Why Gemini?

✅ **Free Tier**: 15 requests per minute, 1 million tokens per month (FREE)  
✅ **Fast**: 1-2 second response times  
✅ **Cost-Effective**: $0.075 per 1M input tokens (paid tier)  
✅ **Reliable**: Google Cloud infrastructure  
✅ **Advanced**: State-of-the-art language model (Gemini 1.5)  

---

## Getting Started

### 1. Obtain API Key

1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API key"**
4. Copy your API key (starts with `AIza...`)

### 2. Configure Environment

```bash
# Set in your .env file or environment
export LLM_PROVIDER=gemini
export GEMINI_API_KEY=AIzaSyD...your-key-here
export GEMINI_MODEL=gemini-1.5-flash  # Optional, default
```

### 3. Install Dependencies

```bash
pip install google-generativeai==0.8.3
```

Already included in `requirements.txt` ✅

---

## Configuration Options

### Available Models

| Model | Speed | Cost | Best For |
|-------|-------|------|----------|
| `gemini-1.5-flash` | Fast | Free tier | Production (default) |
| `gemini-1.5-pro` | Medium | Paid | Complex queries |
| `gemini-pro` | Fast | Free tier | Legacy support |

### Environment Variables

```bash
LLM_PROVIDER=gemini                    # Required: Enable Gemini
GEMINI_API_KEY=AIzaSyD...              # Required: Your API key
GEMINI_MODEL=gemini-1.5-flash          # Optional: Model name (default)
```

---

## Pricing

### Free Tier (Generous!)
- **15 requests per minute**
- **1 million tokens per month**
- Perfect for small-to-medium deployments

### Paid Tier (When Needed)
- **Input**: $0.075 per 1M tokens
- **Output**: $0.30 per 1M tokens
- **Estimate**: ~$0.00003 per chat request

**Cost Comparison** (per 1,000 requests):
- Ollama: Free (local)
- Gemini: Free (within quota) or ~$0.03
- OpenAI: ~$0.045

---

## Deployment Examples

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app ./app

ENV LLM_PROVIDER=gemini
ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Run:
```bash
docker run -e GEMINI_API_KEY=AIzaSyD... \
           -e LLM_PROVIDER=gemini \
           -p 8000:8000 \
           finzo:latest
```

### Kubernetes

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: finzo-secrets
type: Opaque
stringData:
  gemini-api-key: AIzaSyD-your-actual-key-here
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: finzo-backend
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: finzo
        image: finzo:latest
        env:
        - name: LLM_PROVIDER
          value: "gemini"
        - name: GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: finzo-secrets
              key: gemini-api-key
        - name: GEMINI_MODEL
          value: "gemini-1.5-flash"
```

### Heroku

```bash
heroku config:set LLM_PROVIDER=gemini
heroku config:set GEMINI_API_KEY=AIzaSyD...
heroku config:set GEMINI_MODEL=gemini-1.5-flash
```

---

## Testing

### Local Test (Command Line)

```bash
# Set environment
export LLM_PROVIDER=gemini
export GEMINI_API_KEY=AIzaSyD...

# Start backend
uvicorn app.main:app --reload

# Test in another terminal
curl -X POST http://localhost:8000/api/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"What is my current balance?"}'
```

### Python Test Script

```python
import os
os.environ["LLM_PROVIDER"] = "gemini"
os.environ["GEMINI_API_KEY"] = "AIzaSyD..."

from app.ai.llm_client import call_llm

prompt = {
    "system": "You are a financial assistant.",
    "user": "What's 2+2?",
    "context": "Test query"
}

response = call_llm(prompt)
print(f"Gemini Response: {response}")
```

---

## Error Handling

The client includes comprehensive error handling:

| Error | User Message | Cause |
|-------|-------------|-------|
| Invalid API Key | "Invalid Gemini API key" | Wrong/expired key |
| Quota Exceeded | "Gemini API quota exceeded" | Free tier limit hit |
| Safety Filter | "Response blocked by safety filters" | Content policy violation |
| Network Error | "I'm temporarily unable..." | Connection issue |

---

## Safety Filters

Gemini includes built-in safety filters that may block:
- Financial advice (sometimes overly cautious)
- Personal information requests
- Harmful content

**Solution**: If legitimate queries are blocked, try:
1. Rephrase the question
2. Use more neutral language
3. Switch to OpenAI if persistent issues

---

## Rate Limiting

### Free Tier Limits
- **15 RPM** (requests per minute)
- **1 million tokens/month**

### Best Practices
```python
# Backend automatically handles errors
# Add rate limiting in your API layer:

from fastapi import HTTPException
import time

# Track last request time
last_request = {}

def rate_limit_check(user_id: int):
    now = time.time()
    if user_id in last_request:
        elapsed = now - last_request[user_id]
        if elapsed < 4:  # 15 requests/min = 1 per 4 sec
            raise HTTPException(429, "Please wait before asking again")
    last_request[user_id] = now
```

---

## Monitoring

### Check Usage
1. Visit: https://aistudio.google.com/app/apikey
2. Click on your API key
3. View usage statistics

### Set Quotas
1. Go to Google Cloud Console
2. Navigate to "Generative AI" quotas
3. Set custom limits to prevent overages

---

## Migration from OpenAI

Switching is seamless:

```bash
# Before (OpenAI)
export LLM_PROVIDER=openai
export OPENAI_API_KEY=sk-proj-...

# After (Gemini)
export LLM_PROVIDER=gemini
export GEMINI_API_KEY=AIzaSyD...

# That's it! No code changes needed.
```

---

## Advantages vs Alternatives

| Feature | Ollama | OpenAI | Gemini |
|---------|--------|--------|--------|
| Cost | Free | $0.045/1k | Free tier + $0.03/1k |
| Speed | 2-5s | 1-2s | 1-2s |
| Reliability | Local only | 99.9% | 99.9% |
| Free Tier | Unlimited | None | 1M tokens/mo |
| Setup | Complex | Simple | Simple |

---

## Troubleshooting

### "Gemini library not installed"
```bash
pip install google-generativeai==0.8.3
```

### "Invalid API key"
- Verify key at https://aistudio.google.com/app/apikey
- Ensure no extra spaces in environment variable
- Key should start with `AIza`

### "Quota exceeded"
- Check usage at https://aistudio.google.com/app/apikey
- Wait for quota reset (per minute or monthly)
- Upgrade to paid tier if needed

### "Safety filter blocked"
- Rephrase your question with neutral language
- Avoid financial advice requests
- Try OpenAI as alternative

### "Empty response"
- Check if model name is correct
- Verify API key has proper permissions
- Check logs for detailed error

---

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use secrets management**: K8s Secrets, AWS Secrets Manager
3. **Rotate keys regularly**: Every 90 days recommended
4. **Restrict API key**: Use Google Cloud Console to limit domains
5. **Monitor usage**: Set up alerts for unusual patterns

---

## Production Checklist

- [ ] Obtain Gemini API key
- [ ] Add key to secrets manager
- [ ] Set `LLM_PROVIDER=gemini` in deployment
- [ ] Set `GEMINI_API_KEY` in environment
- [ ] Test chat endpoint in staging
- [ ] Monitor usage at https://aistudio.google.com
- [ ] Set up quota alerts
- [ ] Document rollback procedure
- [ ] Train team on Gemini-specific behaviors

---

## Next Steps

1. **Get API Key**: https://aistudio.google.com/app/apikey
2. **Test Locally**: Set env vars and run chat test
3. **Deploy to Staging**: Verify with real users
4. **Monitor Usage**: Track quota consumption
5. **Deploy to Production**: Roll out gradually

---

## Support Resources

- **API Documentation**: https://ai.google.dev/docs
- **API Key Management**: https://aistudio.google.com/app/apikey
- **Pricing**: https://ai.google.dev/pricing
- **Status Page**: https://status.cloud.google.com/
- **Community**: https://developers.googleblog.com/

---

## Conclusion

Google Gemini provides an excellent balance of:
- ✅ **Cost** (free tier is generous)
- ✅ **Performance** (fast response times)
- ✅ **Quality** (state-of-the-art model)
- ✅ **Reliability** (Google infrastructure)

Perfect for production deployment with minimal costs! 🚀

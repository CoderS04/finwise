# Finzo LLM Provider Configuration

## Overview

Finzo supports a **hybrid deployment approach** that allows you to use different LLM providers for different environments:

- **Development**: Ollama (local, free, privacy-focused)
- **Production**: OpenAI (cloud-based, highly reliable)

No code changes needed—just set environment variables!

---

## Local Development (Ollama)

### Prerequisites
- Ollama installed and running
- Neural-chat model downloaded: `ollama pull neural-chat`

### Configuration
```bash
# .env file (or environment variables)
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=neural-chat
```

### Verify Setup
```bash
# Start Ollama service
ollama serve

# In another terminal, test the model
curl http://localhost:11434/api/generate -d '{"model":"neural-chat","prompt":"Hello"}'
```

---

## Production Deployment (OpenAI)

### Prerequisites
- OpenAI API key (obtain from https://platform.openai.com/api-keys)
- Python openai library (automatically installed via requirements.txt)

### Configuration
```bash
# .env file or production environment variables
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your-actual-api-key-here
```

### Cost Optimization
- **Model**: `gpt-4o-mini` (cheaper alternative to gpt-4o)
- **Temperature**: 0.2 (deterministic responses, lower token usage)
- **Max Tokens**: 1000 (limits response length)

### Estimated Costs
- Input tokens: ~$0.15 per 1M tokens
- Output tokens: ~$0.60 per 1M tokens
- Average chat response: ~300 tokens (~$0.000045 per request)

### Secure API Key Management
1. **Never commit API keys** to version control
2. Use environment variables or secrets manager:
   - AWS Secrets Manager
   - Google Cloud Secret Manager
   - Azure Key Vault
   - Environment variables with restricted access

3. Example for Docker/Kubernetes:
```yaml
env:
  - name: LLM_PROVIDER
    value: "openai"
  - name: OPENAI_API_KEY
    valueFrom:
      secretKeyRef:
        name: finzo-secrets
        key: openai-api-key
```

---

## Switching Between Providers

### At Runtime
Simply change the `LLM_PROVIDER` environment variable:

```bash
# Dev
export LLM_PROVIDER=ollama

# Production
export LLM_PROVIDER=openai
export OPENAI_API_KEY=sk-...
```

### Deployment Commands

**Local Development:**
```bash
# Start backend with Ollama
export LLM_PROVIDER=ollama
uvicorn app.main:app --reload
```

**Production:**
```bash
# Docker/Cloud deployment
export LLM_PROVIDER=openai
export OPENAI_API_KEY=sk-proj-...
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## Error Handling

Both providers include graceful error handling:

| Scenario | Behavior |
|----------|----------|
| Ollama not running | Fallback response: "I'm temporarily unable..." |
| OpenAI API key missing | Fallback response with helpful message |
| OpenAI rate limit hit | User-friendly error message |
| Network timeout | Automatic fallback to safe response |

---

## Monitoring & Debugging

### Enable Logging
```python
# In llm_client.py, error reasons are printed:
print(f"[LLM Error] {reason}")
```

### Check Which Provider is Active
```python
from app.ai.llm_client import LLM_PROVIDER
print(f"Active LLM Provider: {LLM_PROVIDER}")
```

### Test the Configuration
```bash
# Test Ollama
curl http://localhost:11434/api/generate \
  -d '{"model":"neural-chat","prompt":"test"}'

# Test OpenAI (requires API key)
python -c "from openai import OpenAI; print('OpenAI library working')"
```

---

## Migration Path

1. **Start**: Use Ollama locally during development
2. **Test**: Verify chat functionality works with Ollama
3. **Deploy**: Set `LLM_PROVIDER=openai` with API key in production
4. **Monitor**: Track API usage and costs
5. **Optimize**: Adjust temperature/tokens if needed

---

## References

- [Ollama Documentation](https://ollama.ai)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [gpt-4o-mini Pricing](https://openai.com/pricing)

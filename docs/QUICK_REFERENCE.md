# Hybrid LLM Deployment - Quick Reference

## 🎯 What This Enables

- **Development**: Use free local Ollama
- **Production**: Use powerful OpenAI API
- **Same Code**: No code changes needed anywhere
- **Easy Switch**: Just change one environment variable

---

## 🚀 Quick Start

### Local Development (Default)
```bash
# Already working! Just keep running:
ollama serve  # Terminal 1
uvicorn app.main:app --reload  # Terminal 2
```

### Production Deployment
```bash
# 1. Get API key: https://platform.openai.com/api-keys
# 2. Set environment variables
export LLM_PROVIDER=openai
export OPENAI_API_KEY=sk-proj-your-key-here

# 3. Deploy (Docker, Kubernetes, etc.)
```

---

## 📋 Configuration

### Development (.env)
```
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=neural-chat
```

### Production (.env or secrets)
```
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...
```

---

## 📁 Files Created/Modified

| File | Changes |
|------|---------|
| `backend/app/ai/llm_client.py` | ✅ Updated - hybrid provider routing |
| `backend/requirements.txt` | ✅ Updated - added `openai==1.59.3` |
| `backend/.env.example` | ✅ Created - config template |
| `LLM_DEPLOYMENT.md` | ✅ Created - comprehensive guide |
| `DEPLOYMENT_EXAMPLES.md` | ✅ Created - ready-to-use scripts |
| `HYBRID_DEPLOYMENT_SUMMARY.md` | ✅ Created - full implementation details |

---

## 🔄 How It Works

```
User Message
    ↓
chat_controller.py calls call_llm(prompt)
    ↓
llm_client.py checks LLM_PROVIDER env var
    ↓
    ├─→ "ollama" → _call_ollama() → Local Ollama service
    └─→ "openai" → _call_openai() → OpenAI API
    ↓
Response returned to user
```

**No code changes anywhere else needed!**

---

## 💰 Costs

| Provider | Cost | Speed |
|----------|------|-------|
| Ollama | Free | 2-5s |
| OpenAI (gpt-4o-mini) | ~$0.000045/request | 1-2s |

**Estimate**: 1,000 requests/month ≈ $0.045

---

## ✅ Checklist for Production

- [ ] Obtain OpenAI API key
- [ ] Add `openai==1.59.3` to requirements (already done ✓)
- [ ] Set `LLM_PROVIDER=openai` in production
- [ ] Set `OPENAI_API_KEY=sk-...` in production secrets
- [ ] Test chat endpoint in staging
- [ ] Monitor OpenAI usage dashboard
- [ ] Set spending limit in OpenAI dashboard
- [ ] Prepare rollback plan (switch back to Ollama if needed)

---

## 🔧 Deployment Platforms

See `DEPLOYMENT_EXAMPLES.md` for:
- Docker & Docker Compose
- Kubernetes
- AWS Lambda
- Heroku
- And more...

---

## ❌ Troubleshooting

| Issue | Solution |
|-------|----------|
| "LLM_PROVIDER not set" | Default is `ollama`, should work locally |
| Ollama connection error | Make sure `ollama serve` is running |
| OpenAI API key invalid | Get fresh key from https://platform.openai.com/api-keys |
| Rate limited | Wait 1 minute or upgrade OpenAI plan |
| Chat feature unavailable | Check logs, fallback response shown to users |

---

## 📚 Full Documentation

1. **LLM_DEPLOYMENT.md** - Complete setup guide
2. **DEPLOYMENT_EXAMPLES.md** - Platform-specific examples
3. **HYBRID_DEPLOYMENT_SUMMARY.md** - Implementation details
4. **backend/.env.example** - Configuration reference

---

## 🎓 Key Points

1. **Zero Code Changes**: Just environment variables
2. **Backward Compatible**: All existing code works unchanged
3. **Graceful Fallback**: If LLM unavailable, app continues
4. **Cost Optimized**: gpt-4o-mini for production
5. **Easy Switching**: Change provider in seconds

---

## 🚨 Important Security Notes

1. **Never commit API keys** to version control
2. **Use secrets manager** for production (AWS Secrets, K8s Secrets, etc.)
3. **Restrict API key permissions** to chat API only
4. **Monitor usage** regularly
5. **Set spending limits** on OpenAI dashboard

---

## 🤝 Testing

### Test Local (Ollama)
```bash
# This already works!
curl -X POST http://localhost:8000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message":"Hello"}'
```

### Test Production (OpenAI)
```bash
# After setting env vars
export LLM_PROVIDER=openai
export OPENAI_API_KEY=sk-proj-...

# Same endpoint, different provider
curl -X POST http://localhost:8000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message":"Hello"}'
```

---

## 📞 Support

For issues or questions:
1. Check **LLM_DEPLOYMENT.md** for detailed guidance
2. Review **DEPLOYMENT_EXAMPLES.md** for your platform
3. Check OpenAI API status: https://status.openai.com
4. Review error logs: Both providers log failures clearly


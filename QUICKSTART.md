# 🚀 Finwise AI Chatbot - Quick Start Guide

## What Was Built

A **safe, explainable AI financial assistant** that:
- ✅ Never invents facts (only explains verified data)
- ✅ Blocks investment/crypto/tax advice before LLM
- ✅ Uses local Ollama Phi model (no cloud, privacy-first)
- ✅ Validates responses for safety

## 5-Minute Setup

### 1. Install Ollama (1 min)
```bash
# Download from https://ollama.ai
# macOS:
brew install ollama

# Windows:
choco install ollama

# Linux:
curl https://ollama.ai/install.sh | sh
```

### 2. Download Phi Model (2 min)
```bash
# Start Ollama
ollama serve

# In another terminal:
ollama pull phi
```

### 3. Backend Ready (Already Done!)
- ✅ All 5 AI components implemented
- ✅ Chat endpoint registered
- ✅ Dependencies updated (`requests` added)
- ✅ Tests pass

### 4. Start Backend
```bash
cd backend
uvicorn app.main:app --reload
```

### 5. Optional: Add Frontend Chat UI
See `FRONTEND_CHAT_SETUP.md` for React component code.

## Test It

### Via cURL
```bash
curl -X POST http://localhost:8000/chat/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {your_jwt_token}" \
  -d '{"user_message": "How much did I spend last month?"}'
```

### Via Python
```python
import requests

headers = {"Authorization": "Bearer {token}"}
data = {"user_message": "Why am I overspending?"}
response = requests.post("http://localhost:8000/chat/", json=data, headers=headers)
print(response.json()["response"])
```

### Via Integration Tests
```bash
cd backend
python test_ai_integration.py
# ✅ All AI module tests passed!
```

## Example Conversations

### Good Question
**User:** "Why am I not saving enough?"  
**Finwise:** "Your expenses (₹52k) leave only ₹8k/month to save. Consider reducing food spending by ₹2k."

### Blocked Question
**User:** "Should I invest in crypto?"  
**Finwise:** "I can help with budgeting, spending, savings, and goals. I cannot provide investment advice."

### Empty Question
**User:** ""  
**Finwise:** "Please ask a meaningful question about your finances."

## How It Works (30 seconds)

```
1. Rule Engine: ✓ Is this a safe topic?
   → NO: Return reason, skip LLM
   → YES: Continue

2. Analyzer: Fetch & summarize your data
   (accounts, budgets, goals, savings)

3. Prompt Builder: Build prompt with verified context
   (no raw transactions to LLM)

4. LLM (Phi): Generate response
   (low temperature for consistency)

5. Validator: ✓ Is output safe?
   → NO: Reject or sanitize
   → YES: Return to user
```

## Files Created

```
backend/
├── app/ai/
│   ├── __init__.py                  (module marker)
│   ├── chat_controller.py           (orchestrator)
│   ├── financial_analyzer.py        (data fetch + summarize)
│   ├── rule_engine.py              (pre-LLM safety)
│   ├── prompt_builder.py           (context injection)
│   ├── llm_client.py               (Ollama wrapper)
│   ├── response_validator.py       (post-LLM safety)
│   └── README.md                   (detailed docs)
├── api/
│   └── chat.py                     (endpoint)
├── main.py                         (updated with router)
├── requirements.txt                (updated with requests)
├── test_ai_integration.py          (8 passing tests)
```

## Configuration (Optional)

```bash
export OLLAMA_BASE_URL=http://localhost:11434
export OLLAMA_MODEL=phi
```

Defaults are already set in code.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "LLM service unavailable" | Start Ollama: `ollama serve` |
| Phi model not found | Download: `ollama pull phi` |
| Slow responses | Check system resources (RAM, GPU) |
| Empty chat responses | Ensure Ollama is fully running |

## Safety Guardrails

### Blocked Keywords
`invest`, `stock`, `crypto`, `mutual fund`, `trading`, `ROI`, `tax`, `legal`, etc.

### Data Sharing
- ✅ Aggregates sent to LLM (budget total, goal progress %)
- ❌ Raw transactions NOT sent to LLM
- ❌ Individual spending NOT sent to LLM

### Response Checks
- Length validation (prevent hallucinations)
- Keyword filtering (catch missed investment advice)
- Graceful fallbacks (if LLM unavailable)

## Next Steps

1. **Test the API** (2 min)
   ```bash
   python test_ai_integration.py
   ```

2. **Add Frontend** (optional, 15 min)
   See `FRONTEND_CHAT_SETUP.md`

3. **Customize Rules** (optional)
   Edit `FORBIDDEN_KEYWORDS` in `rule_engine.py`

4. **Monitor Usage** (future)
   Add logging to track questions/responses

## Legal Note

This assistant provides explanations of your financial data and general budgeting advice. It does NOT provide investment, tax, or legal advice. Always consult qualified professionals for those areas.

---

**Status**: ✅ COMPLETE & TESTED

For detailed docs, see:
- `AI_CHATBOT_INTEGRATION.md` - Full integration summary
- `backend/app/ai/README.md` - Component documentation
- `FRONTEND_CHAT_SETUP.md` - Frontend integration code

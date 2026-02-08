# 🧪 Finwise AI Chatbot - Terminal Testing Guide

## Quick Test (2 minutes)

### Prerequisites

All 3 services must be running:

1. **Backend** (FastAPI)
```bash
cd backend
uvicorn app.main:app --reload
# Runs on http://localhost:8000
```

2. **Ollama** (AI Model Service)
```bash
ollama serve
# Runs on http://localhost:11434
```

3. **Database** (PostgreSQL)
```bash
# Should be running automatically
```

### Test the Chatbot

```bash
cd backend
python chat_tester.py
```

**Input**:
```
Email: your-email@example.com
Password: your-password
```

**Example Interaction**:
```
You: How much did I spend last month?
Finwise: Based on your data, you spent ₹52,000 in January. Your largest expenses were food (₹8,000) and utilities (₹3,500).

You: Why am I not saving enough?
Finwise: Your food spending (₹8,000) is 33% over your ₹6,000 budget. Reducing this by ₹2,000 would significantly improve your monthly savings.

You: Should I invest in stocks?
Finwise: I can help with budgeting, spending, savings, and goals. I cannot provide investment advice.

You: /quit
Goodbye!
```

## Commands

Inside the chatbot terminal:

| Command | Purpose |
|---------|---------|
| `/help` | Show help message |
| `/quit` | Exit chatbot |
| `/status` | Check service status |
| `/clear` | Clear chat history (client-side) |

## Terminal Features

✅ **Colored Output**
- Blue: Your messages
- Green: AI responses
- Yellow: Status/warnings
- Red: Errors

✅ **Real-time Status**
- Shows thinking animation
- Displays response time
- Session summary at end

✅ **Service Checks**
- Verifies backend is running
- Verifies Ollama is running
- Shows helpful error messages

✅ **Safe Testing**
- Tests rule engine (blocks investment advice)
- Tests response validator
- Verifies safety checks work

## Test Scenarios

### Scenario 1: Budget Question (Should Succeed)
```
User: How much is my food budget?
Expected: Responds with budget data
```

### Scenario 2: Spending Analysis (Should Succeed)
```
User: Why am I overspending on food?
Expected: Explains with actual data
```

### Scenario 3: Savings Question (Should Succeed)
```
User: How can I save more?
Expected: Provides actionable suggestions
```

### Scenario 4: Goal Progress (Should Succeed)
```
User: How am I doing with my emergency fund?
Expected: Shows goal progress percentage
```

### Scenario 5: Investment Question (Should Block)
```
User: Should I invest in crypto?
Expected: "I can help with budgeting... I cannot provide investment advice."
```

### Scenario 6: Tax Question (Should Block)
```
User: What are my tax deductions?
Expected: "I can help with budgeting... I cannot provide... tax advice."
```

### Scenario 7: Empty Input (Should Reject)
```
User: 
Expected: "Please ask a meaningful question..."
```

## Troubleshooting

### "LLM service unavailable"
```
✗ Problem: Ollama not running
✓ Solution: ollama serve (in new terminal)
```

### "Login failed"
```
✗ Problem: Wrong credentials or user doesn't exist
✓ Solution: Use valid test account email/password
```

### "Backend offline"
```
✗ Problem: FastAPI not running
✓ Solution: uvicorn app.main:app --reload
```

### Slow Responses (10+ seconds)
```
✗ Normal for first response (model loading)
✓ Subsequent responses should be 5-10 seconds
✗ If very slow: Check system RAM/CPU
```

### Response is truncated
```
✗ Problem: Response exceeded max_length
✓ Edit response_validator.py to increase
```

## Performance Expectations

| Metric | Expected |
|--------|----------|
| Login | <1 second |
| Rule Engine Check | <1ms |
| Data Fetch | <100ms |
| LLM Response | 5-10 seconds |
| Total Response | 5-10 seconds |
| Max Response Length | 500 characters |

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Ollama model is loaded
- [ ] Can login with valid credentials
- [ ] Chatbot responds to budget questions
- [ ] Chatbot blocks investment questions
- [ ] Responses are relevant to data
- [ ] No crash on invalid input
- [ ] Session summary shows message count

## Advanced Testing

### Test Rule Engine Only
```python
from app.ai.rule_engine import enforce_rules

# Test blocked question
allowed, reason = enforce_rules("Should I invest?")
print(allowed)  # False
print(reason)   # "I can help with budgeting..."

# Test allowed question
allowed, reason = enforce_rules("How much did I spend?")
print(allowed)  # True
print(reason)   # None
```

### Test Financial Analyzer
```python
from app.ai.financial_analyzer import analyze_user_finances

context = analyze_user_finances(user_id=1)
print(context)
# {
#   'accounts': 2,
#   'total_balance': 50000.0,
#   'monthly_income': 60000.0,
#   'monthly_expense': 52000.0,
#   ...
# }
```

### Test Prompt Builder
```python
from app.ai.prompt_builder import build_prompt

prompt = build_prompt("How am I doing?", context)
print(prompt['system'])   # System instructions
print(prompt['user'])     # User question
print(prompt['context'])  # Injected financial data
```

## What Gets Tested

### ✅ Rules Engine
- Blocks investment topics
- Blocks crypto topics
- Blocks tax advice
- Allows budget questions

### ✅ Financial Analyzer
- Fetches correct account count
- Calculates monthly income/expense
- Shows budget status
- Shows goal progress

### ✅ Prompt Builder
- Injects verified context
- Formats numbers correctly
- Shows budget percentages
- Lists goals with progress

### ✅ LLM Integration
- Calls Ollama correctly
- Handles timeouts
- Graceful fallback
- Temperature is low (0.3)

### ✅ Response Validator
- Accepts safe responses
- Blocks investment advice
- Truncates long responses
- Rejects empty responses

## Next Steps

1. **Terminal Test** (now) ← You are here
2. **Add Frontend UI** (optional)
   - See FRONTEND_CHAT_SETUP.md
3. **Deploy to Production**
   - Ensure Ollama runs on prod
   - Set OLLAMA_BASE_URL env var

## Quick Reference Commands

```bash
# In backend directory:

# Terminal test
python chat_tester.py

# Run integration tests
python test_ai_integration.py

# Start backend
uvicorn app.main:app --reload

# Start Ollama (separate terminal)
ollama serve

# Pull Phi model (first time)
ollama pull phi

# Check Ollama status
curl http://localhost:11434/api/tags
```

## Questions?

See `backend/app/ai/README.md` for component documentation.

# Finwise AI Assistant

A safe, explainable financial AI assistant built on verified data principles.

## Architecture

```
User Question
    ↓
[Rule Engine] → Block dangerous questions
    ↓
[Financial Analyzer] → Fetch & summarize data
    ↓
[Prompt Builder] → Inject verified context
    ↓
[LLM Client] → Call Ollama Phi
    ↓
[Response Validator] → Post-LLM safety check
    ↓
Safe Response
```

## Core Principle

> The AI assistant never thinks. It only explains verified financial facts computed by the backend.

This ensures:
- ✅ **Safe**: No investment/trading advice
- ✅ **Explainable**: All statements backed by data
- ✅ **Non-hallucinatory**: No made-up numbers
- ✅ **Legally defensible**: Stays within scope

## Components

### 1. Financial Analyzer (`financial_analyzer.py`)
- Fetches user's accounts, budgets, goals, savings
- Summarizes into compact context (no raw data)
- Returns aggregates: total balance, monthly income/expenses, budget status

### 2. Rule Engine (`rule_engine.py`)
- Pre-LLM safety guard
- Blocks forbidden topics: investments, crypto, trading, tax advice
- Deterministic, extensible keyword list
- Returns `(allowed: bool, reason: str | None)`

### 3. Prompt Builder (`prompt_builder.py`)
- Constructs structured prompts
- Injects verified financial context
- Sets system boundaries (no investment advice, etc.)
- Never passes raw transactions to LLM

### 4. LLM Client (`llm_client.py`)
- Wraps Ollama Phi model
- Uses local service (no cloud calls)
- Temperature: 0.3 (low for consistency)
- Graceful fallback if service unavailable

### 5. Response Validator (`response_validator.py`)
- Post-LLM safety check
- Validates output length
- Blocks forbidden keywords in response
- Sanitizes or rejects unsafe outputs

## Setup

### Prerequisites

1. **Ollama** installed locally
   ```bash
   # Download from https://ollama.ai
   # Or use: brew install ollama (macOS), choco install ollama (Windows)
   ```

2. **Ollama service running**
   ```bash
   ollama serve
   # In another terminal:
   ollama pull phi
   ```

3. **Backend dependencies**
   ```bash
   pip install -r requirements.txt
   ```

### Configuration

Set these environment variables (optional):

```bash
export OLLAMA_BASE_URL=http://localhost:11434
export OLLAMA_MODEL=phi
```

Defaults are already set in `llm_client.py`.

## API Endpoint

**POST** `/chat/`

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Body:**
```json
{
  "user_message": "Why am I spending so much on food?"
}
```

**Response:**
```json
{
  "response": "Your food spending is 2x higher than recommended. Consider reviewing your dining-out habits.",
  "safe": true
}
```

## Example Flow

### User asks:
```
"Why am I not saving enough?"
```

### Step 1: Rule Engine
- ✅ No forbidden keywords → allowed

### Step 2: Financial Analyzer
```json
{
  "monthly_income": 60000,
  "monthly_expense": 52000,
  "monthly_savings": 8000,
  "budgets": [
    {"name": "Food", "spent": 8000, "limit": 6000, "percentage": 133%}
  ]
}
```

### Step 3: Prompt Builder
Injects context + system boundaries

### Step 4: LLM Output (Phi)
```
"Your expenses, especially food spending (₹8,000), are 33% over budget. 
Reducing this category by ₹2,000 would improve savings."
```

### Step 5: Response Validator
- ✅ Length: OK
- ✅ No forbidden keywords
- ✅ References provided data

### Final Response
```json
{
  "response": "Your food spending (₹8,000) is 33% over budget. Reducing this by ₹2,000 would improve savings.",
  "safe": true
}
```

## Safety Features

### 1. Deterministic Rule Engine
Blocks entire categories of questions before LLM sees them.

**Forbidden Topics:**
- Investments, stocks, crypto
- Trading, forex
- Specific tax/legal advice
- ROI, dividends, bonds

### 2. Context Injection (not raw data)
- No individual transactions to LLM
- Only aggregates: total spent, budget percentage
- Goal names but not target amounts

### 3. Response Validation
- Length checks (prevent hallucinations)
- Keyword filtering (post-LLM)
- Graceful rejection if unsafe

### 4. Ollama Local Model
- No cloud calls (privacy)
- Fast inference
- Full control over behavior

## Testing

### Manual Test

```bash
# 1. Ensure Ollama is running
ollama serve

# 2. In backend directory
python -m pytest test_utility/test_api.py::test_chat -v

# 3. Or use curl
curl -X POST http://localhost:8000/chat/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"user_message": "How much did I spend last month?"}'
```

### Test Cases

| Input | Expected Behavior |
|-------|-------------------|
| "How much did I spend?" | ✅ Answers with data |
| "Should I invest?" | ❌ Blocks with safety message |
| "Why am I overspending?" | ✅ Analyzes budget |
| "" (empty) | ❌ Rejects as invalid |
| "How do I do taxes?" | ❌ Blocks: outside scope |

## Extending the Assistant

### Add a new rule
```python
# In rule_engine.py
FORBIDDEN_KEYWORDS.append("your_new_keyword")
```

### Add a new data source
```python
# In financial_analyzer.py
# Add fetch logic, then include in context_str
```

### Change LLM model
```python
# In llm_client.py or env
export OLLAMA_MODEL=neural-chat  # or any Ollama model
```

### Adjust safety thresholds
```python
# In response_validator.py
VALIDATION_RULES["max_length"] = 800  # increase from 500
```

## Troubleshooting

### "LLM service unavailable"
- Check if Ollama is running: `curl http://localhost:11434/api/tags`
- Start Ollama: `ollama serve`

### Response is empty or truncated
- Check max_length in `response_validator.py`
- Lower LLM temperature if too random (in `llm_client.py`)

### Ollama taking too long
- Ensure Phi model is downloaded: `ollama pull phi`
- Check system resources (RAM, GPU)

### Question blocked unexpectedly
- Review `FORBIDDEN_KEYWORDS` in `rule_engine.py`
- May contain substring of your question

## Future Enhancements

- [ ] Add analytics insights (trends, patterns)
- [ ] Support for goal-specific advice
- [ ] Multi-turn conversations with context
- [ ] Personalized spending recommendations
- [ ] Integration with budget alerts
- [ ] Audit log of all AI responses

## Legal Note

This assistant provides explanations of your financial data and general budgeting advice. It does NOT provide investment, tax, or legal advice. Always consult qualified professionals for those areas.

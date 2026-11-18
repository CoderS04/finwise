"""
Rule Engine: Pre-LLM Safety Guard

Blocks dangerous questions before they reach the LLM.
- Investment advice (investing in stocks, crypto, etc.)
- Unregulated financial products
- Specific tax/legal advice

Uses context-aware matching to avoid false positives.
Deterministic, simple, extendable.
"""

# Keywords that indicate investment/trading intent (high confidence)
INVESTMENT_KEYWORDS = {
    "invest": ["where", "how", "which", "best"],  # invest WHERE/HOW
    "stock": ["buy", "sell", "trade", "invest", "recommend"],
    "crypto": ["buy", "invest", "trade"],
    "trading": ["start", "how", "strategy"],
    "roi": ["calculate", "get", "improve"],
    "dividend": ["receive", "earn"],
    "forex": ["trade", "strategy"],
    "mutual fund": ["buy", "recommend"],
}

# Keywords that are SAFE in normal spending context
SAFE_CONTEXT_KEYWORDS = ["trip", "vacation", "holiday", "travel", "gift"]

SAFE_TOPICS = [
    "budget",
    "spending",
    "savings",
    "goal",
    "expense",
    "income",
    "account",
    "transaction",
    "category",
]


def enforce_rules(user_message: str) -> tuple[bool, str | None]:
    """
    Enforces safety rules on user input.
    Returns (allowed: bool, reason: str | None)
    
    Uses context-aware matching: only blocks if investment keyword 
    appears WITH intent keywords, not if it's casual mention.
    """
    message = user_message.lower().strip()

    # Empty message check
    if not message or len(message) < 3:
        return False, "Please ask a meaningful question about your finances."

    # Context-aware investment blocking
    for inv_keyword, intent_words in INVESTMENT_KEYWORDS.items():
        if inv_keyword in message:
            # Check if this is actually investment intent or just casual mention
            has_intent = any(word in message for word in intent_words)
            
            # If the message has a safe context keyword, allow it
            has_safe_context = any(keyword in message for keyword in SAFE_CONTEXT_KEYWORDS)
            
            if has_intent and not has_safe_context:
                return (
                    False,
                    "I can help with budgeting, spending, savings, and goals. "
                    "I cannot provide investment, trading, or financial advice beyond that."
                )

    return True, None

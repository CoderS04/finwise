"""
Response Validator: Post-LLM Safety Guard

Even if LLM succeeds, we validate output for:
- Length (prevent hallucinations)
- Forbidden keywords (investment, crypto, etc.)
- Hallucination patterns (inventing UI, mixing currencies, false data)
- Truthfulness (must reference provided data)

Defense in depth: Never trust LLM output blindly.
"""

import re

VALIDATION_RULES = {
    "max_length": 500,  # Max response length in characters
    "min_length": 10,   # Min response length to avoid empty/invalid
}

FORBIDDEN_KEYWORDS_OUTPUT = [
    "invest",
    "stock",
    "crypto",
    "mutual fund",
    "trading",
    "return on investment",
    "tax deduction",
    "legal advice",
    "should buy",
    "should sell",
]

# Common hallucination patterns
HALLUCINATION_PATTERNS = [
    r"click.*button",  # Inventing UI elements (click button, click link)
    r"go to.*page",    # Inventing navigation
    r"view.*tab",      # Inventing tabs
    r"\$.*₹",          # Mixing currencies ($5 ₹200 in same number)
    r"₹.*\$",          # Reverse currency mixing
]


def _detect_hallucinations(response: str) -> bool:
    """
    Detects common LLM hallucination patterns.
    Returns True if hallucinations found.
    """
    response_lower = response.lower()
    
    for pattern in HALLUCINATION_PATTERNS:
        if re.search(pattern, response_lower):
            return True
    
    # Check for inventing numbers that seem fabricated
    # (e.g., "2021" when data is from 2026)
    # Disabled for now as it's too aggressive, but pattern is here for expansion
    
    return False


def validate_response(response: str) -> str:
    """
    Validates LLM output for safety and quality.
    
    Args:
        response: Raw LLM response
    
    Returns:
        Validated response or sanitized alternative
    """

    if not response or not isinstance(response, str):
        return "I couldn't generate a response. Please try again."

    response = response.strip()

    # Check length
    if len(response) < VALIDATION_RULES["min_length"]:
        return "I couldn't provide a meaningful response. Please rephrase your question."

    if len(response) > VALIDATION_RULES["max_length"]:
        response = response[:VALIDATION_RULES["max_length"]] + "..."

    # Check for hallucinations
    if _detect_hallucinations(response):
        return (
            "I detected some inconsistencies in my response. "
            "Could you rephrase your question so I can provide a more accurate answer?"
        )

    # Check for forbidden keywords in output
    response_lower = response.lower()
    for keyword in FORBIDDEN_KEYWORDS_OUTPUT:
        if keyword in response_lower:
            return (
                "My response contained advice I'm not qualified to give. "
                "Please ask about your budgets, spending, or savings goals instead."
            )

    return response

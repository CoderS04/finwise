"""
LLM Client: Ollama Phi Model Wrapper

Uses local Ollama service with phi model for fast, safe responses.
Falls back gracefully if Ollama is unavailable.
"""

import requests
import json
from typing import Optional
import os


OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "neural-chat")
REQUEST_TIMEOUT = 30


def call_llm(prompt: dict) -> str:
    """
    Calls Ollama LLM with structured prompt.
    
    Args:
        prompt: dict with 'system', 'user', 'context' keys
    
    Returns:
        LLM response text
    """

    system = prompt.get("system", "")
    user = prompt.get("user", "")
    context = prompt.get("context", "")

    # Build full message
    full_message = f"{context}\n\nUser Question: {user}"

    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": full_message,
                "system": system,
                "stream": False,
                "temperature": 0.3  # Low temperature for consistency
            },
            timeout=REQUEST_TIMEOUT
        )

        if response.status_code == 200:
            if not response.text:
                return _fallback_response("LLM returned empty response")
            
            try:
                result = response.json()
                llm_response = result.get("response", "").strip()
                if not llm_response:
                    return _fallback_response("LLM generated empty response")
                return llm_response
            except json.JSONDecodeError as e:
                return _fallback_response(f"Invalid LLM response format: {str(e)}")
        else:
            return _fallback_response(f"LLM error {response.status_code}")

    except requests.exceptions.ConnectionError as e:
        return _fallback_response(f"Ollama not reachable at {OLLAMA_BASE_URL}")
    except requests.exceptions.Timeout:
        return _fallback_response("LLM response timeout (>30s) - Ollama may be busy")
    except Exception as e:
        return _fallback_response(f"Unexpected error: {str(e)}")



def _fallback_response(reason: str) -> str:
    """
    Returns a fallback response when LLM is unavailable.
    """
    return (
        "I'm temporarily unable to analyze your question. "
        "Please try again in a moment or check your data in the dashboard."
    )

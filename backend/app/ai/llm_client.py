"""
LLM Client: Hybrid Provider Support (Ollama + OpenAI)

Supports multiple LLM providers for flexible deployment:
- Ollama: Local development (requires Ollama service)
- OpenAI: Production deployment (requires OPENAI_API_KEY)

Environment Variables:
- LLM_PROVIDER: "ollama" (default, dev) or "openai" (production)
- OLLAMA_BASE_URL: Ollama service endpoint (default: http://localhost:11434)
- OLLAMA_MODEL: Ollama model name (default: neural-chat)
- OPENAI_API_KEY: OpenAI API key (required for production)
"""

import requests
import json
from typing import Optional
import os

# Configuration
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama").lower()
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "neural-chat")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
REQUEST_TIMEOUT = 30


def call_llm(prompt: dict) -> str:
    """
    Routes to appropriate LLM provider based on configuration.
    
    Args:
        prompt: dict with 'system', 'user', 'context' keys
    
    Returns:
        LLM response text
    """
    if LLM_PROVIDER == "openai":
        return _call_openai(prompt)
    elif LLM_PROVIDER == "ollama":
        return _call_ollama(prompt)
    else:
        return _fallback_response(f"Unknown LLM provider: {LLM_PROVIDER}")


def _call_ollama(prompt: dict) -> str:
    """
    Calls local Ollama service with structured prompt.
    Used for local development.
    
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
                "temperature": 0.2  # Low temperature for consistency
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

    except requests.exceptions.ConnectionError:
        return _fallback_response(f"Ollama not reachable at {OLLAMA_BASE_URL}")
    except requests.exceptions.Timeout:
        return _fallback_response("LLM response timeout (>30s) - Ollama may be busy")
    except Exception as e:
        return _fallback_response(f"Unexpected error: {str(e)}")


def _call_openai(prompt: dict) -> str:
    """
    Calls OpenAI API with structured prompt.
    Used for production deployment.
    
    Requires: OPENAI_API_KEY environment variable
    
    Args:
        prompt: dict with 'system', 'user', 'context' keys
    
    Returns:
        LLM response text
    """
    if not OPENAI_API_KEY:
        return _fallback_response(
            "OpenAI API key not configured. Set OPENAI_API_KEY environment variable."
        )
    
    try:
        from openai import OpenAI
        
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        system = prompt.get("system", "")
        user = prompt.get("user", "")
        context = prompt.get("context", "")
        
        # Build messages for OpenAI chat completion
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": f"{context}\n\nUser Question: {user}"}
        ]
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.2,
            max_tokens=1000
        )
        
        llm_response = response.choices[0].message.content.strip()
        if not llm_response:
            return _fallback_response("OpenAI returned empty response")
        return llm_response
        
    except ImportError:
        return _fallback_response("OpenAI library not installed. Run: pip install openai")
    except Exception as e:
        error_msg = str(e)
        if "invalid_api_key" in error_msg.lower():
            return _fallback_response("Invalid OpenAI API key")
        elif "rate_limit" in error_msg.lower():
            return _fallback_response("OpenAI API rate limit exceeded. Please try again later.")
        else:
            return _fallback_response(f"OpenAI error: {error_msg}")


def _fallback_response(reason: str) -> str:
    """
    Returns a fallback response when LLM is unavailable.
    
    Args:
        reason: Error reason for logging
    
    Returns:
        User-friendly fallback message
    """
    print(f"[LLM Error] {reason}")  # Log for debugging
    return (
        "I'm temporarily unable to analyze your question. "
        "Please try again in a moment or check your data in the dashboard."
    )

"""
Simple rate limiting middleware for FastAPI endpoints.
Tracks requests by IP address and enforces limits per time window.
"""
from functools import wraps
from collections import defaultdict
from datetime import datetime, timedelta
from fastapi import HTTPException, Request
from typing import Callable
import asyncio

# Store: {ip_address: [(timestamp1, timestamp2, ...)]}
_rate_limit_store = defaultdict(list)
_lock = asyncio.Lock()

def rate_limit(max_requests: int, window_seconds: int):
    """
    Rate limiting decorator for FastAPI endpoints.
    
    Args:
        max_requests: Maximum number of requests allowed
        window_seconds: Time window in seconds
    
    Example:
        @rate_limit(max_requests=5, window_seconds=900)  # 5 requests per 15 minutes
        @router.post("/login")
        def login(...): pass
    """
    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Extract request from args/kwargs
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            if not request:
                for value in kwargs.values():
                    if isinstance(value, Request):
                        request = value
                        break
            
            if not request:
                # No request found, skip rate limiting
                return await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
            
            # Get client IP
            client_ip = request.client.host if request.client else "unknown"
            current_time = datetime.utcnow()
            cutoff_time = current_time - timedelta(seconds=window_seconds)
            
            async with _lock:
                # Clean old requests
                _rate_limit_store[client_ip] = [
                    ts for ts in _rate_limit_store[client_ip]
                    if ts > cutoff_time
                ]
                
                # Check if limit exceeded
                if len(_rate_limit_store[client_ip]) >= max_requests:
                    raise HTTPException(
                        status_code=429,
                        detail=f"Too many requests. Try again in {window_seconds} seconds."
                    )
                
                # Add current request
                _rate_limit_store[client_ip].append(current_time)
            
            # Call original function
            if asyncio.iscoroutinefunction(func):
                return await func(*args, **kwargs)
            return func(*args, **kwargs)

        return async_wrapper
    
    return decorator

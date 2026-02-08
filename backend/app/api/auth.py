from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserResponse, UserLogin, PasswordResetRequest, PasswordResetConfirm
from app.models.account import Account
from app.models.user import User
from app.core.database import get_db
from app.core.rate_limiter import rate_limit
from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    validate_password_strength
)
from datetime import timedelta
from jose import jwt, JWTError

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserResponse)
@rate_limit(max_requests=10, window_seconds=3600)  # 10 registrations per hour
def register(user: UserCreate, request: Request, db: Session = Depends(get_db)):
    print(user.model_dump())
    # Validate password strength
    is_valid, error_msg = validate_password_strength(user.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # Check if email already exists
    existing = db.query(User).filter(User.email == user.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    new_user = User(
        email=user.email.lower(),
        hashed_password=hash_password(user.password),
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login")
@rate_limit(max_requests=5, window_seconds=900)  # 5 attempts per 15 minutes
def login(
    credentials: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    # Lookup user by lowercase email
    user = db.query(User).filter(User.email == credentials.email.lower()).first()
    
    # Check user exists, is active, and password is correct
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Create JWT token
    token = create_access_token({"sub": str(user.id)})
    has_accounts = db.query(Account).filter(Account.user_id == user.id).count() > 0
    return {
        "access_token": token,
        "token_type": "bearer",
        "has_accounts": has_accounts
    }


@router.post("/forgot-password")
@rate_limit(max_requests=5, window_seconds=900)  # 5 requests per 15 minutes
def forgot_password(
    payload: PasswordResetRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == payload.email.lower()).first()

    if not user:
        return {"message": "If the email exists, a reset link will be sent."}

    reset_token = create_access_token(
        {"sub": str(user.id), "type": "reset"},
        expires_delta=timedelta(minutes=15)
    )

    # TODO: Send reset_token via email
    return {
        "message": "If the email exists, a reset link will be sent.",
        "reset_token": reset_token
    }


@router.post("/reset-password")
@rate_limit(max_requests=5, window_seconds=900)  # 5 requests per 15 minutes
def reset_password(
    payload: PasswordResetConfirm,
    request: Request,
    db: Session = Depends(get_db)
):
    try:
        token_payload = jwt.decode(
            payload.token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired reset token")

    if token_payload.get("type") != "reset":
        raise HTTPException(status_code=401, detail="Invalid reset token")

    user_id = token_payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid reset token")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    is_valid, error_msg = validate_password_strength(payload.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    user.hashed_password = hash_password(payload.new_password)
    db.commit()

    return {"message": "Password reset successful"}

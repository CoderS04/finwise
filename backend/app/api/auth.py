from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserResponse, UserLogin
from app.models.account import Account
from app.models.user import User
from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    validate_password_strength
)

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
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
def login(
    credentials: UserLogin,
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

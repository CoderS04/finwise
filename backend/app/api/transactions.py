from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.models.category import Category
from app.models.account import Account
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.models.transaction import Transaction
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services.category_engine import categorize_transaction

import pandas as pd


router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.post("/", response_model=TransactionResponse)
def create_transaction(
    tx: TransactionCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    if tx.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    # Determine category_id: use provided one or auto-categorize
    category_id = tx.category_id
    
    if not category_id:
        # Auto-categorize if no category provided
        category_name, source = categorize_transaction(tx.description)
        category = db.query(Category).filter(Category.name.ilike(category_name)).first()
        if category:
            category_id = category.id
    
    # Create transaction with all data from tx.dict() plus user_id
    tx_data = tx.dict()
    tx_data['user_id'] = user.id
    tx_data['category_id'] = category_id
    
    new_tx = Transaction(**tx_data)

    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    return new_tx

@router.get("/", response_model=list[TransactionResponse])
def list_transactions(
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0
):
    return (
        db.query(Transaction)
        .filter(Transaction.user_id == user.id)
        .order_by(Transaction.transaction_date.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

@router.put("/{tx_id}", response_model=TransactionResponse)
def update_transaction(
    tx_id: int,
    tx: TransactionCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    transaction = db.query(Transaction).filter(
        Transaction.id == tx_id,
        Transaction.user_id == user.id
    ).first()

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Update all fields from tx.dict()
    for key, value in tx.dict().items():
        setattr(transaction, key, value)
    
    # If no category_id provided, keep existing one or auto-categorize
    if tx.category_id is None and tx.description:
        category_name, source = categorize_transaction(tx.description)
        category = db.query(Category).filter(Category.name.ilike(category_name)).first()
        if category:
            transaction.category_id = category.id

    db.commit()
    db.refresh(transaction)
    return transaction

@router.delete("/{tx_id}")
def delete_transaction(
    tx_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    transaction = db.query(Transaction).filter(
        Transaction.id == tx_id,
        Transaction.user_id == user.id
    ).first()

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    db.delete(transaction)
    db.commit()
    return {"message": "Transaction deleted"}

@router.post("/upload")
def upload_transactions(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    df = pd.read_csv(file.file)

    for _, row in df.iterrows():
        category_name, _ = categorize_transaction(row["description"])
        category = db.query(Category).filter(Category.name.ilike(category_name)).first()
        tx = Transaction(
            user_id=user.id,
            amount=row["amount"],
            transaction_type=row["type"],
            description=row["description"],
            category_id=category.id,
            transaction_date=row["date"]
        )
        db.add(tx)

    db.commit()
    return {"message": "Transactions uploaded successfully"}

@router.get("/categories")
def get_categories(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    categories = db.query(Category).order_by(Category.name).all()
    return [{"id": c.id, "name": c.name, "type": c.type} for c in categories]

@router.get("/accounts")
def get_accounts(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    accounts = db.query(Account).filter(Account.user_id == user.id).all()
    return [{"id": a.id, "account_name": a.account_name, "account_type": a.account_type} for a in accounts]

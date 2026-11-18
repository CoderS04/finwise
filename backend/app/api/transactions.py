from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.models.category import Category
from app.models.account import Account
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.models.transaction import Transaction
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services.category_engine import categorize_transaction
from app.services.savings_engine import detect_and_store_savings

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
    
    # Update account balance if account_id is provided
    if tx.account_id:
        account = db.query(Account).filter(
            Account.id == tx.account_id,
            Account.user_id == user.id
        ).first()
        
        if account:
            # Adjust balance: subtract for expense, add for income
            if tx.transaction_type == "income":
                account.balance += tx.amount
            else:  # expense
                # Prevent negative balance
                if account.balance < tx.amount:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Insufficient balance. Available: ₹{account.balance:.2f}, Required: ₹{tx.amount:.2f}"
                    )
                account.balance -= tx.amount
    
    db.commit()
    db.refresh(new_tx)
    
    # Recalculate monthly savings for this month/year
    try:
        tx_month = new_tx.transaction_date.month
        tx_year = new_tx.transaction_date.year
        detect_and_store_savings(db, user.id, tx_month, tx_year)
    except Exception as e:
        # Log but don't fail - savings calculation error shouldn't prevent transaction creation
        print(f"Warning: Savings recalculation failed for {tx_month}/{tx_year}: {e}")
    
    return new_tx

@router.get("/", response_model=list[TransactionResponse])
def list_transactions(
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0
):
    if limit > 1000:
        raise HTTPException(status_code=400, detail="Limit cannot exceed 1000")
    if offset < 0:
        raise HTTPException(status_code=400, detail="Offset cannot be negative")
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

    # Store old values for balance recalculation
    old_amount = transaction.amount
    old_type = transaction.transaction_type
    old_account_id = transaction.account_id
    old_date = transaction.transaction_date

    # If account is changing, revert old account balance first
    if old_account_id:
        old_account = db.query(Account).filter(
            Account.id == old_account_id,
            Account.user_id == user.id
        ).first()
        if old_account:
            # Reverse old transaction
            if old_type == "income":
                old_account.balance -= old_amount
            else:
                old_account.balance += old_amount

    # Update all fields from tx.dict()
    for key, value in tx.dict().items():
        setattr(transaction, key, value)
    
    # If no category_id provided, keep existing one or auto-categorize
    if tx.category_id is None and tx.description:
        category_name, source = categorize_transaction(tx.description)
        category = db.query(Category).filter(Category.name.ilike(category_name)).first()
        if category:
            transaction.category_id = category.id

    # Apply new transaction to account
    if tx.account_id:
        new_account = db.query(Account).filter(
            Account.id == tx.account_id,
            Account.user_id == user.id
        ).first()
        if new_account:
            if tx.transaction_type == "income":
                new_account.balance += tx.amount
            else:  # expense
                # Prevent negative balance
                if new_account.balance < tx.amount:
                    # Rollback old account if different
                    if old_account_id and old_account_id != tx.account_id:
                        old_account.balance = old_account.balance + old_amount if old_type == "income" else old_account.balance - old_amount
                    raise HTTPException(
                        status_code=400,
                        detail=f"Insufficient balance. Available: ₹{new_account.balance:.2f}, Required: ₹{tx.amount:.2f}"
                    )
                new_account.balance -= tx.amount

    db.commit()
    db.refresh(transaction)
    
    # Recalculate monthly savings for the transaction month (and old month if changed)
    try:
        tx_month = transaction.transaction_date.month
        tx_year = transaction.transaction_date.year
        detect_and_store_savings(db, user.id, tx_month, tx_year)
        if old_date and (old_date.month != tx_month or old_date.year != tx_year):
            detect_and_store_savings(db, user.id, old_date.month, old_date.year)
    except Exception as e:
        # Log but don't fail - savings calculation error shouldn't prevent transaction update
        print(f"Warning: Savings recalculation failed for {tx_month}/{tx_year}: {e}")
    
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

    # Revert account balance adjustment
    if transaction.account_id:
        account = db.query(Account).filter(
            Account.id == transaction.account_id,
            Account.user_id == user.id
        ).first()
        
        if account:
            # Reverse the balance adjustment
            if transaction.transaction_type == "income":
                account.balance -= transaction.amount
            else:  # expense
                account.balance += transaction.amount

    db.delete(transaction)
    db.commit()
    
    # Recalculate monthly savings after deletion
    try:
        tx_month = transaction.transaction_date.month
        tx_year = transaction.transaction_date.year
        detect_and_store_savings(db, user.id, tx_month, tx_year)
    except Exception as e:
        print(f"Warning: Savings recalculation failed for {tx_month}/{tx_year}: {e}")
    return {"message": "Transaction deleted"}

@router.post("/upload")
def upload_transactions(
    file: UploadFile = File(...),
    account_id: int = Form(...),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    if not account_id:
        raise HTTPException(status_code=400, detail="account_id is required")
    
    # Verify account belongs to user
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found or does not belong to user")
    
    try:
        df = pd.read_csv(file.file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {str(e)}")
    
    # Validate required columns
    required_columns = {"amount", "type", "description", "date"}
    missing_columns = required_columns - set(df.columns)
    if missing_columns:
        raise HTTPException(
            status_code=400,
            detail=f"CSV must have columns: {', '.join(required_columns)}. Missing: {', '.join(missing_columns)}"
        )
    
    # Validate data types and values
    try:
        df["amount"] = pd.to_numeric(df["amount"], errors="raise")
        df["date"] = pd.to_datetime(df["date"], errors="raise")
        
        # Check for negative amounts
        if (df["amount"] <= 0).any():
            raise HTTPException(status_code=400, detail="All amounts must be greater than zero")
        
        # Validate transaction types
        valid_types = {"income", "expense"}
        invalid_types = set(df["type"].unique()) - valid_types
        if invalid_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid transaction types: {', '.join(invalid_types)}. Must be 'income' or 'expense'"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid data format: {str(e)}")
    
    # Process transactions
    transaction_count = 0
    for _, row in df.iterrows():
        try:
            category_name, _ = categorize_transaction(row["description"])
            category = db.query(Category).filter(Category.name.ilike(category_name)).first()
            
            tx = Transaction(
                user_id=user.id,
                account_id=account_id,
                amount=row["amount"],
                transaction_type=row["type"],
                description=row["description"],
                category_id=category.id if category else None,
                transaction_date=row["date"]
            )
            db.add(tx)
            
            # Update account balance for each transaction
            if row["type"] == "income":
                account.balance += row["amount"]
            else:  # expense
                if account.balance < row["amount"]:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Row {_ + 2}: Insufficient balance for transaction of ₹{row['amount']}"
                    )
                account.balance -= row["amount"]
            
            transaction_count += 1
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error processing row {_ + 2}: {str(e)}")
    
    db.commit()
    
    # Detect and store savings
    detected_month = None
    detected_year = None
    if "date" in df.columns:
        parsed_dates = pd.to_datetime(df["date"], errors="coerce")
        max_date = parsed_dates.dropna().max()
        if pd.notna(max_date):
            detected_month = int(max_date.month)
            detected_year = int(max_date.year)
    
    if detected_month and detected_year:
        try:
            detect_and_store_savings(
                db,
                user.id,
                detected_month,
                detected_year
            )
        except Exception as e:
            # Log but don't fail - savings detection error shouldn't prevent transaction upload
            print(f"Warning: Savings detection failed: {e}")
    
    return {"message": f"{transaction_count} transactions uploaded successfully"}

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

# Comprehensive Code Review - Finwise Application
**Date:** February 9, 2026  
**Scope:** Full system analysis from backend APIs to frontend integration

---

## EXECUTIVE SUMMARY

The Finwise application has **31 identified issues** across 5 critical areas:
- **Security:** 4 issues
- **Database & Logic:** 8 issues  
- **API & Error Handling:** 7 issues
- **Frontend Integration:** 6 issues
- **Data Consistency:** 6 issues

**Risk Level:** 🔴 **HIGH** - Multiple issues can cause data corruption, unauthorized access, and financial inconsistencies.

---

## 1. SECURITY ISSUES (4 Issues)

### 1.1 🔴 CRITICAL: Account Balance Not Validated for Negative Values
**File:** `app/api/transactions.py` (lines 48-57)  
**Issue:** Account balance can go negative without restriction
```python
# CURRENT CODE (VULNERABLE):
if tx.transaction_type == "income":
    account.balance += tx.amount
else:  # expense
    account.balance -= tx.amount  # ❌ Can go negative!
```
**Impact:** Users can overspend and create negative account balances  
**Solution:**
```python
if tx.transaction_type == "expense":
    if account.balance < tx.amount:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient balance. Available: ₹{account.balance}"
        )
    account.balance -= tx.amount
else:
    account.balance += tx.amount
```

---

### 1.2 🟡 MEDIUM: Password Reset Not Implemented
**File:** `app/api/auth.py`  
**Issue:** Users cannot reset forgotten passwords - no password reset endpoint  
**Impact:** Users permanently locked out if they forget password  
**Solution:** Implement password reset with:
1. Email verification token
2. Expiring reset link (15 minutes)
3. New password validation
```python
@router.post("/forgot-password")
def request_password_reset(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email.lower()).first()
    if not user:
        # Don't reveal if email exists (security best practice)
        return {"message": "Reset link sent to email if it exists"}
    
    reset_token = create_access_token(
        {"sub": str(user.id), "type": "reset"},
        expires_delta=timedelta(minutes=15)
    )
    # TODO: Send email with reset_token
    return {"message": "Reset link sent"}
```

---

### 1.3 🟡 MEDIUM: No Rate Limiting on Auth Endpoints
**File:** `app/api/auth.py`  
**Issue:** Login/register endpoints vulnerable to brute force attacks  
**Impact:** Attackers can guess passwords without throttling  
**Solution:** Implement rate limiting (e.g., 5 attempts per 15 minutes)
```python
# Add to dependencies
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# Apply to auth routes
@limiter.limit("5/15 minutes")
@router.post("/login")
def login(...): pass
```

---

### 1.4 🟡 MEDIUM: JWT Token Not Validated in Dependencies
**File:** `app/core/dependencies.py` (lines 38-46)  
**Issue:** User lookup is inefficient; doesn't check token expiration in get_current_user  
**Impact:** If token is malformed, generic HTTPException raised without proper logging  
**Solution:**
```python
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Cache user lookup or use session
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User inactive or not found")
        return user
    except JWTError as e:
        logger.error(f"JWT decode error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
```

---

## 2. DATABASE & LOGIC ISSUES (8 Issues)

### 2.1 🔴 CRITICAL: Fixed! Account.balance Not Updated on Transaction Delete
**File:** `app/api/transactions.py` (lines 110-135)  
**Status:** ✅ **ALREADY IMPLEMENTED** - Delete endpoint properly reverses balance  
**Evidence:** Lines 127-133 correctly handle balance reversal

---

### 2.2 🔴 CRITICAL: Budget Query Uses Wrong Field (RECENTLY FIXED)
**File:** `app/ai/financial_analyzer.py` (lines 85-98)  
**Status:** ✅ **FIXED** - Now correctly uses `category_id` instead of non-existent `budget_id`  
**Previous Issue:** `Transaction.budget_id == budget.id` caused AttributeError  
**Current Solution:** `Transaction.category_id == budget.category_id`

---

### 2.3 🟡 MEDIUM: Account Created Without Initial Balance
**File:** `app/api/accounts.py` (lines 27-36)  
**Issue:** Account created with default balance=0.0, but no way to set initial balance
```python
# CURRENT CODE:
new_account = Account(
    user_id=user.id,
    account_name=payload.account_name,
    account_type=payload.account_type,
    currency=payload.currency or "INR",
    # ❌ balance always 0
)
```
**Impact:** Users must add "dummy" income transaction to set correct starting balance  
**Solution:**
```python
# Add initial_balance to schema
class AccountCreate(BaseModel):
    account_name: str
    account_type: str
    currency: str = "INR"
    initial_balance: float = 0.0

# Use it in endpoint
new_account = Account(
    user_id=user.id,
    account_name=payload.account_name,
    account_type=payload.account_type,
    currency=payload.currency or "INR",
    balance=payload.initial_balance
)
```

---

### 2.4 🟡 MEDIUM: Transaction Update Doesn't Recalculate Account Balance
**File:** `app/api/transactions.py` (lines 85-108)  
**Issue:** When updating transaction amount, account balance is NOT adjusted
```python
# CURRENT CODE (INCOMPLETE):
@router.put("/{tx_id}", ...)
def update_transaction(tx_id: int, tx: TransactionCreate, ...):
    transaction = db.query(Transaction).filter(...)
    for key, value in tx.dict().items():
        setattr(transaction, key, value)
    db.commit()
    # ❌ Balance not updated!
```
**Impact:** Changing ₹100 transaction to ₹500 doesn't update account balance  
**Solution:**
```python
# Before updating, reverse old transaction
if transaction.account_id:
    account = db.query(Account).filter(...).first()
    if account:
        if transaction.transaction_type == "income":
            account.balance -= transaction.amount
        else:
            account.balance += transaction.amount

# Update transaction
old_amount = transaction.amount
old_type = transaction.transaction_type
for key, value in tx.dict().items():
    setattr(transaction, key, value)

# Apply new transaction
if tx.account_id:
    account = db.query(Account).filter(...).first()
    if account:
        if tx.transaction_type == "income":
            account.balance += tx.amount
        else:
            account.balance -= tx.amount
```

---

### 2.5 🟡 MEDIUM: No Transactions Table Integrity on Delete
**File:** `app/models/transaction.py`  
**Issue:** Transaction.account_id has no ON DELETE CASCADE
```python
# CURRENT:
account_id = Column(Integer, ForeignKey("accounts.id"))  # ❌ No cascade

# SHOULD BE:
account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"))
category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
```
**Impact:** Deleting account leaves orphaned transactions  
**Solution:** Add `ondelete="CASCADE"` to all ForeignKey columns

---

### 2.6 🟡 MEDIUM: Goal Model Missing deadline_exceeded and metadata
**File:** `app/models/goal.py`  
**Issue:** No way to track if goal deadline passed; no description/notes field
```python
# MISSING:
- deadline_exceeded: Boolean (goal date passed?)
- description: String (reason/notes)
- created_at: DateTime
```
**Impact:** Can't notify users about overdue goals  
**Solution:**
```python
from datetime import datetime

class Goal(Base):
    __tablename__ = "goals"
    # ... existing fields ...
    
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def deadline_exceeded(self):
        from datetime import date
        return self.target_date < date.today() and not self.is_completed
```

---

### 2.7 🟡 MEDIUM: CSV Upload Doesn't Validate File Format
**File:** `app/api/transactions.py` (lines 146-200)  
**Issue:** No column validation before processing CSV
```python
# CURRENT (UNSAFE):
df = pd.read_csv(file.file)
for _, row in df.iterrows():
    # Assumes columns exist: "description", "amount", "type", "date"
    # ❌ Will crash if columns missing
```
**Impact:** Bad CSV file can crash server  
**Solution:**
```python
required_columns = {"amount", "type", "description", "date"}
if not required_columns.issubset(df.columns):
    raise HTTPException(
        status_code=400,
        detail=f"CSV must have columns: {', '.join(required_columns)}"
    )

# Validate data types
try:
    df["amount"] = pd.to_numeric(df["amount"])
    df["date"] = pd.to_datetime(df["date"])
except Exception as e:
    raise HTTPException(status_code=400, detail=f"Invalid data: {str(e)}")
```

---

### 2.8 🟡 MEDIUM: Category Engine CONFIDENCE_THRESHOLD Too Low
**File:** `app/services/category_engine.py` (line 6)  
**Issue:** Threshold of 0.25 is too permissive (25% confidence!)
```python
# CURRENT (TOO LOW):
CONFIDENCE_THRESHOLD = 0.25

# SHOULD BE:
CONFIDENCE_THRESHOLD = 0.7  # 70% confidence minimum
```
**Impact:** Transactions miscategorized with only 25% confidence  
**Solution:** Increase threshold to 0.7 and add fallback to "Uncategorized" when uncertain

---

## 3. API & ERROR HANDLING ISSUES (7 Issues)

### 3.1 🔴 CRITICAL: No Validation for Negative Amounts
**Files:** 
- `app/api/transactions.py` (line 26)
- `app/api/budgets.py` (line 15)
- `app/api/goals.py`
**Issue:** Partial validation - only checks `amount <= 0` in some places
```python
# transactions.py - HAS CHECK:
if tx.amount <= 0:
    raise HTTPException(status_code=400, detail="Amount must be positive")

# budgets.py - HAS CHECK:
if data.monthly_limit <= 0:
    raise HTTPException(...)

# goals.py - MISSING CHECK! ❌
def create_goal(data: GoalCreate, ...):
    goal = Goal(user_id=user.id, **data.dict())
    # No validation that target_amount > 0
```
**Solution:** Add validation to all create/update endpoints
```python
if data.target_amount <= 0:
    raise HTTPException(status_code=400, detail="Target amount must be positive")
```

---

### 3.2 🟡 MEDIUM: Inconsistent Error Responses
**Files:** Multiple endpoints  
**Issue:** Error response format is inconsistent
```python
# transactions.py:
return {"error": "account_id is required"}  # Dict with "error" key

# transactions.py (elsewhere):
raise HTTPException(status_code=400, detail="Amount must be positive")  # HTTPException

# goals.py:
return {"error": "Goal not found"}  # Dict with "error" key
```
**Impact:** Frontend has to handle multiple error formats  
**Solution:** Always use HTTPException for errors:
```python
raise HTTPException(status_code=404, detail="Goal not found")
```

---

### 3.3 🟡 MEDIUM: No Pagination Limit on List Endpoints
**File:** `app/api/transactions.py` (lines 71-81)  
**Issue:** Limit defaults to 50, but no upper limit validation
```python
# CURRENT:
def list_transactions(
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
    limit: int = 50,  # User can request 999999
    offset: int = 0
):
```
**Impact:** Malicious requests can fetch million+ records  
**Solution:**
```python
def list_transactions(
    limit: int = 50,
    offset: int = 0,
    ...
):
    if limit > 1000:
        raise HTTPException(status_code=400, detail="Limit cannot exceed 1000")
    if offset < 0:
        raise HTTPException(status_code=400, detail="Offset cannot be negative")
```

---

### 3.4 🟡 MEDIUM: Missing Validation on Goal Target Date
**File:** `app/api/goals.py` (lines 16-26)  
**Issue:** No check that target_date is in the future
```python
# SHOULD CHECK:
from datetime import date
if data.target_date <= date.today():
    raise HTTPException(status_code=400, detail="Target date must be in the future")
```

---

### 3.5 🟡 MEDIUM: Budget Constraint Validation is Complex
**File:** `app/api/budgets.py` (lines 11-60)  
**Issue:** The budget sum validation has edge cases
```python
# Current logic gets confusing with None checks
# ISSUE: What if monthly budget doesn't exist when creating category budget?
```
**Solution:** Simplify with clear rules:
1. Monthly budget (category_id=None) is optional
2. If set, sum of all category budgets cannot exceed it
3. Always enforce this constraint

---

### 3.6 🟡 MEDIUM: No Transaction Type Validation
**File:** `app/schemas/transaction.py` (line 6)  
**Issue:** transaction_type is String without enum validation
```python
# CURRENT (UNSAFE):
transaction_type: str  # "income" or "expense" - but no validation!

# SHOULD BE:
from enum import Enum
class TransactionType(str, Enum):
    income = "income"
    expense = "expense"

class TransactionCreate(BaseModel):
    transaction_type: TransactionType
```
**Impact:** Backend accepts "invalid_type" or "INCOME" (wrong case)  
**Solution:** Use Pydantic Enum for validation

---

### 3.7 🟡 MEDIUM: Chat Endpoint Not Rate Limited
**File:** `app/api/chat.py`  
**Issue:** No rate limiting on `/chat` endpoint  
**Impact:** Users can spam LLM, exhausting resources  
**Solution:** Add rate limiter (e.g., 10 requests per minute per user)

---

## 4. FRONTEND INTEGRATION ISSUES (6 Issues)

### 4.1 🟡 MEDIUM: No Error Boundary
**File:** `frontend/src/App.jsx`  
**Issue:** No error boundary to catch component errors
```jsx
// If any component crashes, entire app fails
// Should wrap routes in error boundary
```
**Solution:**
```jsx
import ErrorBoundary from './components/ErrorBoundary'

<ErrorBoundary>
  <Routes>
    {/* routes */}
  </Routes>
</ErrorBoundary>
```

---

### 4.2 🟡 MEDIUM: Token Expired Not Handled
**File:** `frontend/src/api/axios.js`  
**Issue:** No interceptor for 401 responses to redirect to login
```javascript
// Current code doesn't handle expired tokens
// User gets stuck on page with stale token
```
**Solution:**
```javascript
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('has_accounts')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

---

### 4.3 🟡 MEDIUM: TransactionForm Doesn't Handle API Errors
**File:** `frontend/src/components/TransactionForm.jsx`  
**Issue:** No error display to user on API failure
```jsx
// Current code:
const handleSubmit = async (e) => {
  // ... form submission
  // No try/catch for API errors
}
```
**Solution:**
```jsx
const [error, setError] = useState(null)

const handleSubmit = async (e) => {
  e.preventDefault()
  setError(null)
  setSaving(true)
  try {
    // API call
  } catch (err) {
    setError(err.response?.data?.detail || 'Failed to save transaction')
  } finally {
    setSaving(false)
  }
}

// Render error
{error && <div className="text-red-600">{error}</div>}
```

---

### 4.4 🟡 MEDIUM: No Loading State on First Load
**File:** `frontend/src/pages/Dashboard.jsx`  
**Issue:** Charts display as empty while loading
```jsx
// Should show skeleton loaders during initial load
```
**Solution:** Show loading state with skeleton components

---

### 4.5 🟡 MEDIUM: First Login No Accounts Redirect Can Loop
**File:** `frontend/src/App.jsx` (lines 56-57)  
**Issue:** If user is on /accounts and has no accounts, might create infinite redirect
```jsx
// RISKY:
{firstLoginNoAccounts && <Route path="*" element={<Navigate to="/accounts" />} />}
```
**Solution:** Clear flag after user creates first account:
```jsx
// In AccountManager component:
useEffect(() => {
  // After creating first account
  setFirstLoginNoAccounts(false)
  localStorage.removeItem('first_login_no_accounts')
}, [accountCreated])
```

---

### 4.6 🟡 MEDIUM: No Validation on Negative Amounts in Frontend
**File:** `frontend/src/components/TransactionForm.jsx`  
**Issue:** Frontend doesn't validate amount > 0
```jsx
// SHOULD ADD:
if (form.amount <= 0) {
  setError('Amount must be greater than 0')
  return
}
```

---

## 5. DATA CONSISTENCY ISSUES (6 Issues)

### 5.1 🔴 CRITICAL: Income/Expense Savings Calculation Not Atomic
**Files:** `app/services/analytics_service.py`, `app/ai/financial_analyzer.py`  
**Issue:** Multiple independent queries - if transaction inserted between income and expense query, calculations are wrong
```python
# CURRENT (NOT ATOMIC):
income = db.query(func.sum(...)).filter(...).scalar()  # Query 1
expense = db.query(func.sum(...)).filter(...).scalar()  # Query 2
savings = income - expense  # ❌ Data might have changed between queries
```
**Solution:** Use single query with CASE statement:
```python
from sqlalchemy import func, case

result = db.query(
    func.sum(case(
        (Transaction.transaction_type == "income", Transaction.amount),
        else_=0
    )).label("income"),
    func.sum(case(
        (Transaction.transaction_type == "expense", Transaction.amount),
        else_=0
    )).label("expense")
).filter(
    Transaction.user_id == user_id,
    # ... date filters
).first()

income = result.income or 0
expense = result.expense or 0
savings = income - expense
```

---

### 5.2 🟡 MEDIUM: Account Balance Not Synced with Transactions
**File:** Multiple files  
**Issue:** Account.balance is calculated separately from transactions
- Account balance in `accounts` table
- But income/expense calculated from `transactions` table
- These can drift if transaction is not reflected in account
**Solution:** Make balance calculated/derived on the fly:
```python
# Option 1: Remove balance column and calculate on read
def get_account_balance(db, account_id):
    result = db.query(func.sum(...)).filter(...).scalar()
    return result or 0

# Option 2: Keep balance but add validation trigger
# (Advanced: needs database triggers or audit log)
```

---

### 5.3 🟡 MEDIUM: Monthly Savings Not Updated on Transaction Changes
**File:** `app/api/transactions.py`  
**Issue:** When transaction created/updated/deleted:
- Account balance is updated ✅
- But monthly savings NOT recalculated ❌
```python
# After creating/updating transaction:
# Should call: reset_monthly_savings(db, user_id, month, year)
# Then: detect_and_store_savings(db, user_id, month, year)
```
**Impact:** Savings dashboard shows stale data  
**Solution:** Add savings recalculation after transaction operations

---

### 5.4 🟡 MEDIUM: Goal Progress Not Updated on Allocation
**File:** `app/services/goal_progress.py`  
**Issue:** When user allocates savings to goal:
- GoalAllocation created ✅
- But Goal.current_amount might not be updated consistently ❌
**Solution:** Ensure apply_allocations properly updates goal amounts:
```python
def apply_allocations(goals, allocations):
    for alloc in allocations:
        goal = next((g for g in goals if g.id == alloc["goal_id"]), None)
        if goal:
            goal.current_amount += alloc["allocated_amount"]
            if goal.current_amount >= goal.target_amount:
                goal.is_completed = True
```

---

### 5.5 🟡 MEDIUM: Budget Spending Calculation Uses Wrong Month
**File:** `app/ai/financial_analyzer.py` (lines 85-98)  
**Issue:** Budget calculation doesn't filter by month/year
```python
# CURRENT:
spent = db.query(func.sum(Transaction.amount)).filter(
    Transaction.user_id == user_id,
    Transaction.category_id == budget.category_id,
    # ❌ MISSING: month/year filter!
)
```
**Impact:** Budget "spent" amount includes all months, not just budget month  
**Solution:**
```python
month_start = datetime(budget.year, budget.month, 1)
month_end = datetime(budget.year, budget.month + 1, 1) if budget.month < 12 else datetime(budget.year + 1, 1, 1)

spent = db.query(func.sum(Transaction.amount)).filter(
    Transaction.user_id == user_id,
    Transaction.category_id == budget.category_id,
    Transaction.transaction_type == "expense",
    Transaction.transaction_date >= month_start,
    Transaction.transaction_date < month_end
).scalar() or 0
```

---

### 5.6 🟡 MEDIUM: Savings Detection Not Idempotent
**File:** `app/services/savings_engine.py`  
**Issue:** Calling savings detection twice might create duplicate allocations  
**Solution:** Check if savings_record already exists before creating:
```python
existing = db.query(MonthlySavings).filter(
    MonthlySavings.user_id == user_id,
    MonthlySavings.month == month,
    MonthlySavings.year == year
).first()

if existing:
    # Delete old allocations and recreate
    db.query(GoalAllocation).filter(GoalAllocation.savings_id == existing.id).delete()
    db.delete(existing)
```

---

## 6. ADDITIONAL OBSERVATIONS

### Good Practices ✅
1. **JWT Authentication:** Properly implemented with token expiration
2. **User Isolation:** All queries filter by user_id (prevents data leakage)
3. **Transaction Deletion:** Properly reverses account balance
4. **CORS Configuration:** Environment-aware (strict in production)
5. **Password Hashing:** Using bcrypt (secure)
6. **Category Auto-Categorization:** Good UX with fallback

### Missing Features ⚠️
1. Audit log (track all changes for compliance)
2. Backup/restore functionality
3. Multi-currency support (only INR)
4. Recurring transactions
5. Transaction search/filters (limit 50 hardcoded)
6. Export to CSV/PDF
7. Budget alerts
8. Goal milestones
9. User notifications
10. Admin dashboard

---

## 7. PRIORITY FIX ORDER

### Phase 1 - CRITICAL (Do First) 🔴
1. ✅ Fix Budget query - ALREADY DONE
2. Prevent negative account balance (Issue 1.1)
3. Add rate limiting on auth (Issue 1.3)
4. Validate all transaction amounts (Issue 3.1)
5. Make income/expense calculation atomic (Issue 5.1)

### Phase 2 - HIGH (Do Next) 🟠
1. Handle transaction update with balance recalculation (Issue 2.4)
2. Add initial_balance to account creation (Issue 2.3)
3. Fix CSV validation (Issue 2.7)
4. Add token expiration handling in frontend (Issue 4.2)
5. Fix budget spending month filter (Issue 5.5)

### Phase 3 - MEDIUM (Do Later) 🟡
1. Implement password reset (Issue 1.2)
2. Add ForeignKey cascade rules (Issue 2.5)
3. Implement error boundary in frontend (Issue 4.1)
4. Add goal deadline tracking (Issue 2.6)
5. Fix savings detection idempotency (Issue 5.6)
6. Increase categorization confidence threshold (Issue 2.8)

### Phase 4 - LOW (Nice to Have) 🔵
1. Add audit logging
2. Implement recurring transactions
3. Add transaction search/filters
4. Add notifications system
5. Create admin dashboard

---

## 8. TESTING RECOMMENDATIONS

### Unit Tests Needed
```python
# Test negative balance prevention
def test_transaction_prevents_negative_balance():
    assert raises HTTPException when expense > balance

# Test transaction update recalculates balance
def test_transaction_update_updates_balance():
    assert updated_transaction updates account balance

# Test atomic income/expense calculation
def test_income_expense_atomic():
    # Add transactions in background thread
    # Verify no data races
    pass

# Test budget month filtering
def test_budget_spending_filters_by_month():
    assert spending includes only transactions in budget month
```

### Integration Tests Needed
```javascript
// Frontend: Test token expiration handling
test("Redirect to login when token expired", async () => {
  // Mock 401 response
  // Verify redirect to login
})

// Test transaction create → balance update → savings recalculation
test("Transaction creation triggers savings update", async () => {
  // Create transaction
  // Verify account balance updated
  // Verify savings recalculated
})
```

---

## 9. DEPLOYMENT CHECKLIST

Before going to production:
- [ ] Fix all CRITICAL issues (Phase 1)
- [ ] Add rate limiting
- [ ] Implement password reset
- [ ] Add error logging/monitoring
- [ ] Run security audit (SQL injection, XSS, CSRF)
- [ ] Load test with 1000+ concurrent users
- [ ] Backup database before migration
- [ ] Test disaster recovery
- [ ] Document API in OpenAPI/Swagger
- [ ] Add health check endpoints
- [ ] Implement database transaction logs

---

## 10. CONCLUSION

The Finwise application has a solid foundation with good authentication and user isolation. However, there are **critical data consistency issues** (atomic calculations, balance management) that must be fixed before production.

**Estimated Fix Time:**
- Phase 1 (Critical): 4-6 hours
- Phase 2 (High): 8-10 hours
- Phase 3 (Medium): 6-8 hours
- Phase 4 (Low): 4-6 hours

**Total: ~25-30 hours of development**

---

**Report Generated:** February 9, 2026  
**Reviewed By:** Comprehensive Code Analysis System

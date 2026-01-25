from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from app.api import auth, transactions, budgets, budget_insights, budget_suggestions, analytics, accounts
from app.core.database import Base, engine

from app.models import user, account, category, transaction, budget, goal

from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title="Finwise API",
    swagger_ui_parameters={"syntaxHighlight.theme": "obsidian"}
)

# Configure CORS based on environment
allowed_origins = settings.get_allowed_origins()
if settings.is_production():
    # In production, only allow specified origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Content-Type", "Authorization"],
    )
else:
    # In development, allow localhost variations
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(budgets.router)
app.include_router(budget_insights.router)
app.include_router(budget_suggestions.router)
app.include_router(analytics.router)
app.include_router(accounts.router)

@app.on_event("startup")
def create_tables():
    """Ensure database tables exist before serving requests."""
    Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"message": "Finwise backend running 🚀"}

@app.get("/health")
def health():
    return {"status": "ok"}
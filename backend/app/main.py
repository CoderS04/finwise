from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from app.api import auth, transactions, budgets, budget_insights, budget_suggestions, analytics
from app.core.database import Base, engine

from app.models import user, account, category, transaction, budget, goal

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Finwise API",
    swagger_ui_parameters={"syntaxHighlight.theme": "obsidian"}
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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


@app.on_event("startup")
def create_tables():
    """Ensure database tables exist before serving requests."""
    Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"message": "Finwise backend running 🚀"}

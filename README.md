# Finwise 💰

Finwise is a smart finance tracker that helps users track, analyze, and optimize their spending using AI-powered insights.

## Tech Stack
- Backend: FastAPI (Python)
- Frontend: React + Axios
- Database: PostgreSQL
- AI (Planned): LLM-powered insights & chatbot
- Future DB: MongoDB (chat & AI logs)

## Current Features
- Expense tracking
- Auto categorization
- Analytics dashboard
- Secure authentication

## Planned Features
- AI-generated financial insights
- Chatbot assistant
- Goal planning
- Recommendation engine

## Setup (Local)
```bash
# backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# frontend
cd frontend
npm install
npm run dev

# Finwise

Finwise is a full-stack personal finance management application for tracking accounts, expenses, budgets, savings goals, and financial insights. It combines a React dashboard with a FastAPI backend, PostgreSQL persistence, JWT authentication, analytics, and an AI-assisted financial chat experience.

## Key Features

- JWT-based registration and login
- Multiple account management
- Income and expense transaction tracking
- Transaction categorization and filtering
- Dashboard analytics and spending summaries
- Budget planning and budget insights
- Savings and financial goal planning
- Goal allocation and savings detection
- AI-powered chat and financial analysis support
- Responsive React interface
- Automatic startup schema synchronization

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Axios
- Recharts
- Lucide React

### Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Pydantic Settings
- JWT authentication
- OpenAI, Google Gemini, or local Ollama integrations

## Project Structure

```text
finwise/
├── backend/
│   ├── app/
│   │   ├── api/          # REST API routes
│   │   ├── core/         # Configuration, database, dependencies
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── services/     # Application services
│   │   └── ai/           # AI chat and financial analysis
│   ├── alembic/          # Database migrations
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/   # Shared UI components
    │   ├── pages/        # Application screens
    │   └── api/          # API client modules
    └── package.json
```

## Local Setup

### Prerequisites

- Python 3.11 or newer
- Node.js 20 or newer
- PostgreSQL

### 1. Configure the backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

- Windows: `.venv\Scripts\activate`
- macOS/Linux: `source .venv/bin/activate`

Install dependencies:

```bash
pip install -r requirements.txt
```

Copy the example environment file and update the values:

```bash
cp .env.example .env
```

Required backend settings include:

```env
APP_NAME=Finwise
SECRET_KEY=replace-with-a-long-random-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=postgresql://postgres:password@localhost:5432/finwise
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
LLM_PROVIDER=ollama
AUTO_SCHEMA_UPDATE=false
DEBUG=false
```

Start the API:

```bash
uvicorn app.main:app --reload
```

The API documentation will be available at `http://localhost:8000/docs`.

### 2. Configure the frontend

```bash
cd frontend
npm install
npm run dev
```

The development site will normally run at `http://localhost:5173`.

Create `frontend/.env.local` if the backend URL needs to be customized:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Production Deployment

The application can be deployed as separate backend and frontend services.

For the backend service, configure `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `ENVIRONMENT`, `ALLOWED_ORIGINS`, and the selected AI provider variables in the hosting platform.

Use the active PostgreSQL database's internal URL when both services are hosted on Render in the same network. Use the external database URL when connecting from outside Render.

The `DATABASE_URL` may use either of these forms:

```text
postgresql://user:password@host:5432/database
postgres://user:password@host:5432/database
```

Before deployment, confirm that:

- The PostgreSQL database is active and not expired or deleted.
- `DATABASE_URL` contains the database host, credentials, port, and database name.
- `ALLOWED_ORIGINS` contains the deployed frontend URL.
- The backend uses a strong, private `SECRET_KEY`.
- The frontend is built with the correct production API URL.

## Development Checks

Run the frontend build:

```bash
cd frontend
npm run build
```

Run the frontend linter:

```bash
cd frontend
npm run lint
```

Check backend syntax:

```bash
cd backend
python -m compileall app
```

## Security

- Authentication uses signed JWT access tokens.
- Passwords are hashed before database storage.
- Secrets and database URLs should be supplied through environment variables.
- Never commit `.env` or `.env.production` files.

## API

FastAPI provides interactive API documentation through Swagger UI and ReDoc:

- Swagger UI: `/docs`
- ReDoc: `/redoc`
- Health check: `/health`

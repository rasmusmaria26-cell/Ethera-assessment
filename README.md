# Ethera — Team Task Manager

A collaborative task management web app where teams create projects, invite members, assign tasks, and track progress. Lightweight Trello/Asana alternative.

**Live URL:** *(add Railway URL after deployment)*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS v3 |
| Backend | Node.js, Express 4 |
| Database | PostgreSQL via Supabase (raw `pg`, no ORM) |
| Auth | JWT HS256 (7-day expiry) + bcrypt |
| Deploy | Railway |

---

## Local Setup

### Prerequisites
- Node.js ≥ 18
- A [Supabase](https://supabase.com) project (free tier)

### 1. Clone the repo
```bash
git clone https://github.com/your-username/ethera.git
cd ethera
```

### 2. Run the database schema
1. Open your Supabase project → **SQL Editor**
2. Paste and run the contents of `backend/src/db/schema.sql`

### 3. Backend setup
```bash
cd backend
npm install

# Copy and fill in env vars
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, etc.

npm run dev
# Backend running on http://localhost:3000
```

### 4. Frontend setup
```bash
cd frontend
npm install

# (optional) copy env example — not needed for local dev (Vite proxy handles /api)
cp .env.example .env

npm run dev
# Frontend running on http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string | `postgresql://postgres:[password]@[host]:5432/postgres` |
| `JWT_SECRET` | Random secret ≥ 32 chars for signing JWTs | `a-long-random-string-here` |
| `PORT` | Express listen port | `3000` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` (dev) or Railway frontend URL |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend base URL | Not needed in dev (Vite proxy). Set to Railway backend URL in production. |

---

## Railway Deployment

### Step 1 — Push to GitHub
Push the repo to a GitHub repository.

### Step 2 — Create Railway project
1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your repo

### Step 3 — Backend service
1. In Railway, add a service → set **Root Directory** to `backend/`
2. Set **Start Command** to `node src/index.js`
3. Add environment variables:
   - `DATABASE_URL` — from Supabase → Settings → Database → Connection string (use the **pooler** URL)
   - `JWT_SECRET` — a long random secret
   - `FRONTEND_URL` — your Railway frontend URL (add after frontend deploys)
   - `PORT` — Railway sets this automatically; you can omit it

### Step 4 — Frontend service
1. In Railway, add another service → same repo
2. Set **Root Directory** to `frontend/`
3. Set **Build Command** to `npm run build`
4. Set **Output Directory** to `dist`
5. Add environment variable:
   - `VITE_API_URL` — your Railway backend URL (e.g. `https://ethera-backend-xxxx.railway.app`)

### Step 5 — Update CORS
Go back to the backend service → update `FRONTEND_URL` to the Railway frontend URL.

---

## Role-Based Access Control

| Action | Admin | Member |
|---|---|---|
| View project / tasks | ✓ | ✓ |
| View dashboard | ✓ | ✓ |
| Create task | ✓ | ✗ |
| Edit task (all fields) | ✓ | ✗ |
| Update own task status | ✓ | ✓ (only if assigned) |
| Delete task | ✓ | ✗ |
| Add / remove members | ✓ | ✗ |

All role checks are enforced **server-side**. Frontend guards are UI-only enhancements.

---

## Design

Warm editorial aesthetic — cream background (`#f5f0e8`), terracotta accent (`#c2643f`), Playfair Display headings, DM Sans UI text.

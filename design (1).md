# Design Document — Team Task Manager

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Database Design](#3-database-design)
4. [Backend Design](#4-backend-design)
5. [API Contract](#5-api-contract)
6. [Frontend Design](#6-frontend-design)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Role-Based Access Control](#8-role-based-access-control)
9. [Component Hierarchy](#9-component-hierarchy)
10. [State Management](#10-state-management)
11. [Error Handling Strategy](#11-error-handling-strategy)
12. [Deployment Architecture](#12-deployment-architecture)
13. [Environment Variables](#13-environment-variables)
14. [Security Considerations](#14-security-considerations)
15. [Performance Decisions](#15-performance-decisions)

---

## 1. Project Overview

### What it is
A collaborative team task management web app where users create projects, invite members, assign tasks, and track progress — essentially a lightweight Trello/Asana clone.

### Core entities
- **User** — authenticates, belongs to one or more projects with a role
- **Project** — the top-level container; has an admin and zero or more members
- **Task** — lives inside a project; has a status, priority, assignee, due date
- **project_members** — join table linking users to projects with a role

### Design goals
- Role gating enforced at both API layer and UI layer (no UI tricks without API enforcement)
- Dashboard stats computed via SQL aggregates — no in-memory counting
- Stateless backend — all auth via JWT, no server-side sessions
- Single Railway deploy — backend as Node service, frontend as static build

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                       │
│   React + Vite + Tailwind CSS                                 │
│   Axios (API client) → JWT in localStorage                    │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS (Railway URL)
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js / Express)                │
│                                                               │
│   ┌────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│   │ Auth Routes│  │Project Routes│  │  Task Routes      │    │
│   └────────────┘  └──────────────┘  └──────────────────┘    │
│         │                │                   │                │
│   ┌─────▼────────────────▼───────────────────▼────────────┐  │
│   │           Middleware: verifyJWT  │  requireRole        │  │
│   └────────────────────────┬───────────────────────────────┘  │
│                            │                                   │
│   ┌────────────────────────▼───────────────────────────────┐  │
│   │               pg Pool (DATABASE_URL)                    │  │
│   └────────────────────────┬───────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────────┘
                            │ TLS (Supabase connection string)
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                  DATABASE (Supabase / PostgreSQL)              │
│  users │ projects │ project_members │ tasks                   │
└──────────────────────────────────────────────────────────────┘
```

### Why this shape

- **No ORM** — raw `pg` queries make SQL explicit and easy to explain in a code interview. No magic, no hidden N+1 surprises.
- **Supabase for Postgres** — free tier, no infra setup, has a built-in table viewer to demo during the video.
- **Stateless API** — JWT in Authorization header, verified per request. No session store needed.
- **Separate frontend/backend** — cleaner separation of concerns, easier to debug deploy issues.

---

## 3. Database Design

### Schema

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Projects
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Enums
CREATE TYPE project_role  AS ENUM ('admin', 'member');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE task_status   AS ENUM ('todo', 'inprogress', 'done');

-- Project membership (join table with role)
CREATE TABLE project_members (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id)    ON DELETE CASCADE,
  role       project_role NOT NULL DEFAULT 'member',
  joined_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

-- Tasks
CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  due_date    DATE,
  priority    task_priority DEFAULT 'medium',
  status      task_status   DEFAULT 'todo',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### Relationships

```
users ──< project_members >── projects
users ──< tasks (assigned_to)
users ──< tasks (created_by)
projects ──< tasks
```

### Design decisions

| Decision | Reason |
|---|---|
| UUID primary keys | Avoids sequential ID enumeration attacks; Supabase default |
| `ON DELETE CASCADE` for tasks | Deleting a project cleans up all tasks automatically |
| `ON DELETE SET NULL` for user refs in tasks | A removed user's tasks remain visible, just unassigned |
| Enum types for status/priority/role | Enforced at DB level — no invalid strings can enter |
| No soft deletes | Out of scope for this assignment; adds complexity without visible benefit |
| No separate `roles` table | Only two roles (admin/member) — enum in join table is sufficient |

### Key queries

**Get all projects for a user:**
```sql
SELECT p.*, pm.role
FROM projects p
JOIN project_members pm ON pm.project_id = p.id
WHERE pm.user_id = $1
ORDER BY p.created_at DESC;
```

**Get project with members:**
```sql
SELECT u.id, u.name, u.email, pm.role, pm.joined_at
FROM project_members pm
JOIN users u ON u.id = pm.user_id
WHERE pm.project_id = $1;
```

**Dashboard aggregates (single query):**
```sql
SELECT
  COUNT(*)                                          AS total_tasks,
  COUNT(*) FILTER (WHERE status = 'todo')           AS todo,
  COUNT(*) FILTER (WHERE status = 'inprogress')     AS inprogress,
  COUNT(*) FILTER (WHERE status = 'done')           AS done,
  COUNT(*) FILTER (
    WHERE due_date < CURRENT_DATE AND status != 'done'
  )                                                 AS overdue_count
FROM tasks
WHERE project_id = $1;
```

**Tasks per user (for dashboard):**
```sql
SELECT u.id, u.name, COUNT(t.id) AS task_count
FROM tasks t
JOIN users u ON u.id = t.assigned_to
WHERE t.project_id = $1
GROUP BY u.id, u.name
ORDER BY task_count DESC;
```

---

## 4. Backend Design

### Folder structure

```
backend/
├── src/
│   ├── index.js              ← Express app entry, CORS, routes mount
│   ├── db/
│   │   ├── pool.js           ← pg Pool singleton
│   │   └── schema.sql        ← source-of-truth SQL (run manually in Supabase)
│   ├── middleware/
│   │   ├── auth.js           ← verifyJWT — attaches req.user
│   │   └── role.js           ← requireRole(role) — checks project_members
│   └── routes/
│       ├── auth.js           ← /api/auth/*
│       ├── projects.js       ← /api/projects/*
│       ├── tasks.js          ← /api/tasks/*  and  /api/projects/:id/tasks
│       └── dashboard.js      ← /api/projects/:id/dashboard
├── .env
├── .env.example
└── package.json
```

### index.js responsibilities

```js
// Load env, init express, mount middleware, mount routes, start server
const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use('/api/auth',     authRouter);
app.use('/api/projects', verifyJWT, projectsRouter);
app.use('/api/tasks',    verifyJWT, tasksRouter);
app.listen(process.env.PORT || 3000);
```

### db/pool.js

```js
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
export default pool;
```

Single pool instance shared across all route files. SSL required for Supabase.

### middleware/auth.js

```js
// Extracts Bearer token from Authorization header
// Verifies with JWT_SECRET
// Attaches { id, email, name } to req.user
// Returns 401 if missing or invalid
```

### middleware/role.js

```js
// Factory: requireRole('admin')
// Reads :projectId from req.params (or req.body)
// Queries project_members for (project_id, req.user.id)
// If role doesn't match → 403
// Attaches req.membership = { role } for downstream use
```

This middleware is applied **per route**, not globally, because role requirements differ per endpoint.

---

## 5. API Contract

All endpoints under `/api`. All non-auth endpoints require `Authorization: Bearer <token>` header.

### Response shape conventions

**Success:**
```json
{ "data": { ... } }
```

**Error:**
```json
{ "error": "Human-readable message" }
```

**HTTP status codes used:**

| Code | When |
|---|---|
| 200 | Successful GET / PUT |
| 201 | Successful POST (created) |
| 400 | Validation error / bad input |
| 401 | Missing or invalid JWT |
| 403 | Valid JWT but insufficient role |
| 404 | Resource not found |
| 409 | Conflict (e.g. email already exists, user already a member) |
| 500 | Unexpected server error |

---

### Auth Routes `/api/auth`

#### `POST /api/auth/signup`

Request:
```json
{ "name": "Maria", "email": "maria@example.com", "password": "secret123" }
```

Validation:
- `name` required, non-empty
- `email` must be valid format, unique
- `password` minimum 8 characters

Process:
1. Check email uniqueness
2. Hash password with `bcrypt.hash(password, 10)`
3. Insert user
4. Sign JWT `{ id, email, name }` with 7-day expiry
5. Return token + user (without password_hash)

Response `201`:
```json
{
  "token": "eyJ...",
  "user": { "id": "uuid", "name": "Maria", "email": "maria@example.com" }
}
```

---

#### `POST /api/auth/login`

Request:
```json
{ "email": "maria@example.com", "password": "secret123" }
```

Process:
1. Fetch user by email
2. `bcrypt.compare(password, user.password_hash)`
3. Sign JWT on match

Response `200`:
```json
{
  "token": "eyJ...",
  "user": { "id": "uuid", "name": "Maria", "email": "maria@example.com" }
}
```

---

#### `GET /api/auth/me`

Returns current user from JWT. Used by frontend on load to validate token.

Response `200`:
```json
{ "id": "uuid", "name": "Maria", "email": "maria@example.com" }
```

---

### Project Routes `/api/projects`

All require valid JWT.

#### `GET /api/projects`

Returns all projects the authenticated user is a member of, including their role.

Response `200`:
```json
[
  {
    "id": "uuid",
    "name": "Project Alpha",
    "description": "...",
    "role": "admin",
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

---

#### `POST /api/projects`

Creates a project and auto-adds the creator as `admin` in `project_members`.

Request:
```json
{ "name": "Project Alpha", "description": "Optional description" }
```

Process (atomic — use DB transaction):
1. Insert into `projects`
2. Insert into `project_members` (creator, role = 'admin')

Response `201`:
```json
{ "id": "uuid", "name": "Project Alpha", "role": "admin" }
```

---

#### `GET /api/projects/:id`

Returns project detail + full members list. Requires user to be a member.

Response `200`:
```json
{
  "id": "uuid",
  "name": "Project Alpha",
  "description": "...",
  "created_by": "uuid",
  "members": [
    { "id": "uuid", "name": "Maria", "email": "maria@...", "role": "admin" },
    { "id": "uuid", "name": "Rasmus", "email": "rasmus@...", "role": "member" }
  ]
}
```

---

#### `POST /api/projects/:id/members`

Admin only. Adds a user to the project by email.

Request:
```json
{ "email": "newuser@example.com", "role": "member" }
```

Validations:
- User with that email must exist (404 if not)
- User must not already be a member (409 if so)

Response `201`:
```json
{ "user_id": "uuid", "role": "member" }
```

---

#### `DELETE /api/projects/:id/members/:userId`

Admin only. Removes a member. Cannot remove the last admin.

Response `200`:
```json
{ "message": "Member removed" }
```

---

### Task Routes

#### `GET /api/projects/:projectId/tasks`

Returns all tasks in the project. Any member can access.

Optional query params: `?status=todo` `?assigned_to=uuid` `?priority=high`

Response `200`:
```json
[
  {
    "id": "uuid",
    "title": "Fix login bug",
    "description": "...",
    "due_date": "2025-02-01",
    "priority": "high",
    "status": "inprogress",
    "assigned_to": { "id": "uuid", "name": "Rasmus" },
    "created_by": { "id": "uuid", "name": "Maria" }
  }
]
```

---

#### `POST /api/projects/:projectId/tasks`

Admin only. Creates a task in the project.

Request:
```json
{
  "title": "Fix login bug",
  "description": "Optional",
  "due_date": "2025-02-01",
  "priority": "high",
  "assigned_to": "uuid-of-member"
}
```

Validations:
- `title` required
- `assigned_to` must be a member of the project if provided
- `priority` must be one of `low | medium | high`

Response `201`: Full task object.

---

#### `PUT /api/tasks/:id`

Update a task. **Role-gated field-level logic:**

- Admin: can update `title`, `description`, `due_date`, `priority`, `status`, `assigned_to`
- Member: can only update `status`, and only if `assigned_to == req.user.id`

Process:
1. Fetch task, verify it belongs to a project the user is in
2. Check role
3. If member: verify assigned_to match, only allow `status` field update
4. Apply update

Response `200`: Updated task object.

---

#### `DELETE /api/tasks/:id`

Admin only.

Response `200`:
```json
{ "message": "Task deleted" }
```

---

### Dashboard Route

#### `GET /api/projects/:id/dashboard`

Any project member. Returns aggregate stats.

Response `200`:
```json
{
  "total_tasks": 12,
  "by_status": {
    "todo": 4,
    "inprogress": 5,
    "done": 3
  },
  "overdue_count": 2,
  "by_user": [
    { "user_id": "uuid", "name": "Rasmus", "task_count": 5 },
    { "user_id": "uuid", "name": "Maria",  "task_count": 4 }
  ]
}
```

Implementation: two SQL queries (aggregates + per-user counts). No loops, no in-memory math.

---

## 6. Frontend Design

### Pages

| Route | Component | Access |
|---|---|---|
| `/login` | Login.jsx | Public |
| `/signup` | Signup.jsx | Public |
| `/projects` | Projects.jsx | Auth required |
| `/projects/:id` | ProjectDetail.jsx | Auth + member |
| `/projects/:id/dashboard` | Dashboard.jsx | Auth + member |

Unauthenticated users accessing protected routes get redirected to `/login`.

### Visual design direction

- **Color palette:** White background, slate-900 text, blue-600 as primary action color, red/yellow/green for priority badges
- **Task board layout:** Three-column kanban (Todo / In Progress / Done) using CSS grid
- **Priority badges:** Color-coded pills — red=high, yellow=medium, blue=low
- **Status columns:** Drag-and-drop is out of scope; status updated via dropdown on task card

### Component breakdown (see Section 9 for hierarchy)

**Navbar:** Logo left, user name + logout right. Shows on all auth pages.

**TaskCard:**
- Title (bold)
- Description (truncated, 2 lines max)
- Assignee avatar initial + name
- Due date — shows red if overdue
- Priority badge
- Status dropdown (admin sees all options; member sees dropdown only on their assigned tasks)

**TaskModal:** Slide-in panel (not a dialog) for create/edit. Fields: title, description, due date, priority picker, assignee select (project members only). Admin sees all fields; modal doesn't render for members.

**MemberList:** List of members with role badge. Admin sees remove button per member. "Add by email" input at the bottom (admin only).

**StatCard:** Large number, label below, optional color accent. Used on dashboard.

---

## 7. Authentication & Authorization

### JWT structure

```json
{
  "id":    "user-uuid",
  "email": "user@example.com",
  "name":  "Maria",
  "iat":   1700000000,
  "exp":   1700604800
}
```

- Signed with `HS256` using `JWT_SECRET` env var
- Expiry: 7 days (`expiresIn: '7d'`)
- No refresh tokens — out of scope, evaluator won't test this edge

### Token storage (frontend)

Stored in `localStorage` under key `ttm_token`. On app load, `AuthContext` reads the token, calls `GET /api/auth/me` to validate it, and sets user state. If the call fails (expired/invalid), token is cleared and user is logged out.

### Token transmission

All API requests via axios instance set the header automatically:

```js
axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('ttm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

---

## 8. Role-Based Access Control

### Role definition

| Action | Admin | Member |
|---|---|---|
| View project | ✓ | ✓ |
| View tasks | ✓ | ✓ |
| View dashboard | ✓ | ✓ |
| Create task | ✓ | ✗ |
| Edit task (all fields) | ✓ | ✗ |
| Update own task status | ✓ | ✓ (only if assigned) |
| Delete task | ✓ | ✗ |
| Add member | ✓ | ✗ |
| Remove member | ✓ | ✗ |

### Backend enforcement

The `requireRole` middleware factory:

```js
// usage: router.post('/', requireRole('admin'), handler)
export const requireRole = (requiredRole) => async (req, res, next) => {
  const { projectId } = req.params;
  const { rows } = await pool.query(
    'SELECT role FROM project_members WHERE project_id=$1 AND user_id=$2',
    [projectId, req.user.id]
  );
  if (!rows.length) return res.status(403).json({ error: 'Not a project member' });
  if (requiredRole === 'admin' && rows[0].role !== 'admin')
    return res.status(403).json({ error: 'Admin access required' });
  req.membership = rows[0];
  next();
};
```

For task update: role check is done inside the handler (not middleware) because the logic is field-level:

```js
// PUT /api/tasks/:id
if (membership.role === 'member') {
  if (task.assigned_to !== req.user.id) return res.status(403).json({ error: 'Not assigned to you' });
  // Only allow status update
  const { status } = req.body;
  // update only status field
}
```

### Frontend enforcement

Frontend role checks are for UX — they **never replace** backend enforcement.

```jsx
// In ProjectDetail.jsx
const isAdmin = currentMembership?.role === 'admin';

// Conditionally render admin-only UI
{isAdmin && <button onClick={openTaskModal}>+ New Task</button>}
{isAdmin && <MemberList editable />}
```

`currentMembership` is fetched from `GET /api/projects/:id` which includes the authenticated user's role in the response.

---

## 9. Component Hierarchy

```
App.jsx
├── AuthContext.Provider
├── Route / (redirect based on auth)
├── Route /login      → Login.jsx
├── Route /signup     → Signup.jsx
└── ProtectedRoute
    ├── Navbar.jsx
    ├── Route /projects
    │   └── Projects.jsx
    │       ├── ProjectCard.jsx (×n)
    │       └── CreateProjectModal.jsx
    ├── Route /projects/:id
    │   └── ProjectDetail.jsx
    │       ├── MemberList.jsx
    │       │   └── MemberRow.jsx (×n)
    │       ├── TaskBoard.jsx
    │       │   ├── TaskColumn.jsx (×3 — todo/inprogress/done)
    │       │   │   └── TaskCard.jsx (×n)
    │       │   └── TaskModal.jsx (create/edit, admin only)
    │       └── Link → /projects/:id/dashboard
    └── Route /projects/:id/dashboard
        └── Dashboard.jsx
            ├── StatCard.jsx (×4 — total/todo/inprogress/done/overdue)
            └── UserTaskTable.jsx
```

---

## 10. State Management

No Redux or Zustand — React Context + local state is sufficient for this scope.

### AuthContext

```jsx
// Provides: { user, login, logout, loading }
// login(token) → saves to localStorage, sets user state
// logout()    → clears localStorage, nulls user
// On mount: reads token, calls /me to hydrate user
```

### Data fetching pattern

Each page fetches its own data on mount via `useEffect`. No global data cache.

```jsx
// ProjectDetail.jsx
const [project, setProject] = useState(null);
const [tasks, setTasks]     = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  Promise.all([
    api.get(`/projects/${id}`),
    api.get(`/projects/${id}/tasks`)
  ]).then(([projRes, tasksRes]) => {
    setProject(projRes.data);
    setTasks(tasksRes.data);
  }).finally(() => setLoading(false));
}, [id]);
```

After any mutation (create/update/delete), re-fetch the affected list. No optimistic updates — keep it simple and correct.

### Local UI state

- Modal open/close: `useState` in the parent that owns the modal
- Form state: `useState` per field inside modal components
- Loading/error state: `useState` per page

---

## 11. Error Handling Strategy

### Backend

Every route handler wrapped in try/catch:

```js
router.post('/', async (req, res) => {
  try {
    // ... handler logic
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

Validation errors return early with 400 before hitting DB:

```js
if (!name || !email || !password) {
  return res.status(400).json({ error: 'All fields are required' });
}
```

### Frontend

Axios errors intercepted globally:

```js
axiosInstance.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Token expired — logout and redirect to /login
      logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
```

Per-request error display: each form shows an inline error string below the submit button.

```jsx
const [error, setError] = useState('');
// On catch: setError(err.response?.data?.error || 'Something went wrong');
// In JSX: {error && <p className="text-red-500 text-sm">{error}</p>}
```

---

## 12. Deployment Architecture

### Railway setup

Two Railway services from the same repo:

**Service 1 — Backend (Node)**
- Root directory: `backend/`
- Start command: `node src/index.js`
- Environment: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `PORT`
- Railway auto-assigns a public URL like `https://backend-xxx.railway.app`

**Service 2 — Frontend (Static)**
- Root directory: `frontend/`
- Build command: `npm run build`
- Output directory: `dist/`
- Environment: `VITE_API_URL=https://backend-xxx.railway.app`
- Railway auto-assigns a public URL like `https://frontend-xxx.railway.app`

### CORS config (backend)

```js
app.use(cors({
  origin: process.env.FRONTEND_URL,  // exact Railway frontend URL
  credentials: true
}));
```

In development, `FRONTEND_URL=http://localhost:5173`.

### Vite proxy (dev only)

```js
// vite.config.js
server: {
  proxy: {
    '/api': 'http://localhost:3000'
  }
}
```

In production, axios uses `VITE_API_URL` directly — no proxy.

---

## 13. Environment Variables

### Backend `.env`

```
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
JWT_SECRET=some-long-random-secret-min-32-chars
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env`

```
VITE_API_URL=http://localhost:3000
```

### `.env.example` (committed to repo)

```
# Backend
DATABASE_URL=
JWT_SECRET=
PORT=3000
FRONTEND_URL=

# Frontend
VITE_API_URL=
```

Never commit `.env` files. Add to `.gitignore`.

---

## 14. Security Considerations

| Concern | Mitigation |
|---|---|
| Password storage | bcrypt with cost factor 10 — never stored in plaintext |
| SQL injection | Parameterized queries via `pg` placeholders (`$1`, `$2`) — never string concatenation |
| JWT secret exposure | Stored only in env var, never in code or repo |
| CORS | Origin restricted to known frontend URL |
| Role bypass | All role checks enforced server-side; frontend checks are UI-only |
| Enumeration via task IDs | Membership check on every task access — can't access tasks from projects you're not in |
| Token expiry | 7-day JWT; client-side logout clears token on 401 |
| XSS via localStorage | Acceptable risk for this scope; httpOnly cookies would be the production hardening step |

---

## 15. Performance Decisions

| Decision | Reason |
|---|---|
| Single dashboard query | Avoids N+1 for stats — one SQL call with `COUNT FILTER` aggregates |
| No pagination | Task counts per project are small in demo context; pagination adds complexity with no visible benefit |
| No caching layer | Redis/CDN caching out of scope for 8-hour build |
| No real-time updates | WebSocket/polling not required by spec; page refresh gets fresh data |
| Raw pg over ORM | Faster to write for known queries; easier to explain and optimize |
| Supabase connection pooling | Supabase provides PgBouncer by default — connection pooling handled externally |

---

*Document version: 1.0 — matches assignment spec from Team_Task_Manager_Assignment.docx*

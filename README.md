Ethara is a tool that helps teams manage their projects and tasks. You can create projects, add team members, and track work using a board.

**Live Website:** [https://ethera-frontend-production-808f.up.railway.app/](https://ethera-frontend-production-808f.up.railway.app/)

---

## What you can do

- **Create Projects**: Start a new workspace for your team's goals.
- **Manage Tasks**: Move tasks between "Todo," "In Progress," and "Done."
- **Assign Members**: Add people to your project and give them specific tasks.
- **Track Progress**: Use dashboards to see how much work is finished and who is busy.
- **Secure Login**: Use an email and password to log in safely.

---

## Tech Stack

| Part | Technology | Description |
|---|---|---|
| **Frontend** | React, Vite | The website the user interacts with. |
| **Backend** | Node.js, Express | The server that handles data and logic. |
| **Database** | PostgreSQL, Supabase | Where all project and task data is stored. |
| **Styling** | Custom CSS, Tailwind | How the app looks (Cream, Ink, and Gold). |
| **Deployment** | Railway | Where the app is hosted online. |

---

## How to run it locally

### 1. Download the code
Download the files to your computer:
```bash
git clone https://github.com/rasmusmaria26-cell/Ethara-assessment.git
cd ethara
```

### 2. Set up the Database
1. Create a free project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in Supabase.
3. Copy the text from `backend/src/db/schema.sql`, paste it into the editor, and click **Run**.

### 3. Set up the Backend (Server)
1. Go to the backend folder: `cd backend`.
2. Install the required files: `npm install`.
3. Create a `.env` file (see `.env.example` for what to include).
4. You must add your `DATABASE_URL` and a random string for `JWT_SECRET`.
5. Start the server: `npm run dev`.

### 4. Set up the Frontend (App)
1. Go to the frontend folder: `cd frontend`.
2. Install the required files: `npm install`.
3. Start the app: `npm run dev`.
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | What it is | Example |
|---|---|---|
| `DATABASE_URL` | Your Supabase connection string | `postgresql://...` |
| `JWT_SECRET` | A long random password for security | `my-secret-key-123` |
| `PORT` | The port the server runs on | `3000` |
| `FRONTEND_URL` | The URL of your frontend app | `http://localhost:5173` |

---

## Deployment on Railway

This project is deployed on **Railway**. 

1. **Connect GitHub**: Connect this repository to your Railway project.
2. **Setup Services**: Create two services—one for `frontend` and one for `backend`.
3. **Environment Variables**: Add your `.env` variables to each service in the Railway dashboard.
4. **Custom Commands**: Set the Build and Start commands to use the monorepo structure (e.g., `npm run build --workspace=frontend`).

---

## Permissions (Who can do what)

| Action | Admin | Member |
|---|---|---|
| View project and tasks | Yes | Yes |
| Create new tasks | Yes | No |
| Edit any task | Yes | No |
| Update task status | Yes | Yes (if assigned) |
| Manage team members | Yes | No |

---

## Design
The app uses a simple and clean design:
- **Colors**: Cream background, dark ink text, and gold highlights.
- **Fonts**: *Playfair Display* for large titles and *DM Sans* for regular text.
- **Responsive**: It works on phones, tablets, and computers.

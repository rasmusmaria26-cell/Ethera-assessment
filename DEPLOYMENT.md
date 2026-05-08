# Deployment Guide: Ethera (Vercel + GitHub)

This guide walks you through deploying the **Ethera** monorepo to Vercel. We will deploy the frontend and backend as two separate Vercel projects linked to the same GitHub repository.

## Phase 1: Push to GitHub

1.  **Initialize Git** (if not already done):
    ```bash
    git init
    git add .
    git commit -m "Prepare for deployment"
    ```
2.  **Create a New Repo on GitHub**:
    - Go to [github.new](https://github.new) and create a repository named `ethera`.
3.  **Push your code**:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/ethera.git
    git branch -M main
    git push -u origin main
    ```

---

## Phase 2: Deploy the Backend (API)

1.  Go to the [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New" > "Project"**.
2.  Import your `ethera` repository.
3.  **Configure Project**:
    - **Project Name**: `ethera-api` (or similar).
    - **Root Directory**: Select `backend`.
    - **Build & Development Settings**: Keep defaults (Vercel will detect the `vercel.json`).
4.  **Environment Variables**:
    - Add `DATABASE_URL`: (Paste your Supabase connection string).
    - Add `JWT_SECRET`: (Use a long random string).
    - Add `FRONTEND_URL`: (You will update this later with the frontend URL).
5.  Click **Deploy**. Once finished, copy the **Deployment URL** (e.g., `https://ethera-api.vercel.app`).

---

## Phase 3: Deploy the Frontend (UI)

1.  Click **"Add New" > "Project"** again.
2.  Import the same `ethera` repository.
3.  **Configure Project**:
    - **Project Name**: `ethera-app` (or similar).
    - **Root Directory**: Select `frontend`.
    - **Framework Preset**: Vite.
4.  **Environment Variables**:
    - Add `VITE_API_URL`: (Paste your Backend Deployment URL from Phase 2).
5.  Click **Deploy**. Once finished, copy the **Frontend URL** (e.g., `https://ethera-app.vercel.app`).

---

## Phase 4: Final Connection (CORS)

1.  Go back to your **Backend Project** settings on Vercel.
2.  Update the `FRONTEND_URL` environment variable to match your **Frontend URL** (e.g., `https://ethera-app.vercel.app`).
3.  Redeploy the backend (or trigger a new build) to apply the CORS update.

---

## Technical Notes

- **CORS**: The backend only allows requests from the `FRONTEND_URL`.
- **SPA Routing**: The `frontend/vercel.json` ensures that refreshing the page on a route like `/projects` doesn't result in a 404.
- **Cookies**: Auth is handled via cookies with `credentials: true`. Ensure both domains are on the same base domain if you use custom domains, otherwise, standard `.vercel.app` domains work fine.

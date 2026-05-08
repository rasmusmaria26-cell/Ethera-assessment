# Deployment Guide: Ethera (Vercel Multi-Service)

This guide walks you through deploying the **Ethera** monorepo to Vercel using the new **Multi-Service** deployment pattern.

## Phase 1: Push to GitHub

1.  **Initialize Git** (if not already done):
    ```bash
    git init
    git add .
    git commit -m "Add Vercel multi-service config"
    ```
2.  **Push your code**:
    ```bash
    git push -u origin main
    ```

---

## Phase 2: Deploy to Vercel

1.  Go to the [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New" > "Project"**.
2.  Import your `ethera` repository.
3.  **Vercel should detect the root `vercel.json`**:
    - It will automatically set up two services: `frontend` (Vite) and `backend` (Express).
4.  **Environment Variables**:
    - Add these to the project settings:
    - `DATABASE_URL`: Your Supabase connection string.
    - `JWT_SECRET`: A long random string.
    - `FRONTEND_URL`: The final deployment URL (Vercel will provide this).
5.  Click **Deploy**.

---

## Phase 3: Post-Deployment Check

1.  Once deployed, Vercel will give you a single URL (e.g., `https://ethera-assessment.vercel.app`).
2.  The Frontend will live at the root: `/`.
3.  The API will live at: `/api`.
4.  In your **Frontend Settings**, ensure `VITE_API_URL` is set to your deployment URL if you want to use absolute paths, but with this multi-service setup, **relative paths** (like `/api/...`) will work automatically!

---

## Technical Details

- **Service Mapping**:
  - `frontend` -> `/`
  - `backend` -> `/api`
- **SPA Support**: Handled via `frontend/vercel.json`.
- **Express Support**: Handled via `backend/vercel.json`.

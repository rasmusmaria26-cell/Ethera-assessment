ETHARA -- TEAM TASK MANAGER
============================

Ethara is a tool that helps teams manage their projects and tasks. You can create projects, add team members, and track work using a board.

LIVE WEBSITE: https://ethera-assessment.vercel.app
GITHUB REPO:  https://github.com/rasmusmaria26-cell/Ethara-assessment.git

WHAT YOU CAN DO
---------------
- Create Projects: Start a new workspace for your team's goals.
- Manage Tasks: Move tasks between "Todo," "In Progress," and "Done."
- Assign Members: Add people to your project and give them specific tasks.
- Track Progress: Use dashboards to see how much work is finished and who is busy.
- Secure Login: Use an email and password to log in safely.

TECH STACK
----------
- Frontend: React and Vite (The website interface).
- Backend: Node.js and Express (The server for logic).
- Database: PostgreSQL and Supabase (Where data is stored).
- Styling: Custom CSS and Tailwind (The app's design).
- Deployment: Vercel (Where the app is hosted online).

HOW TO RUN IT LOCALLY
---------------------

1. Download the code:
   git clone https://github.com/rasmusmaria26-cell/Ethara-assessment.git
   cd ethara

2. Set up the Database:
   - Create a free project on Supabase (https://supabase.com).
   - Go to the SQL Editor in Supabase.
   - Copy the text from backend/src/db/schema.sql, paste it into the editor, and click Run.

3. Set up the Backend (Server):
   - Go to the backend folder: cd backend
   - Install the required files: npm install
   - Create a .env file (see .env.example).
   - You must add your DATABASE_URL and a random string for JWT_SECRET.
   - Start the server: npm run dev

4. Set up the Frontend (App):
   - Go to the frontend folder: cd frontend
   - Install the required files: npm install
   - Start the app: npm run dev
   - Open http://localhost:5173 in your browser.

ENVIRONMENT VARIABLES
---------------------

Backend (backend/.env):
- DATABASE_URL: Your Supabase connection string.
- JWT_SECRET: A long random password for security.
- PORT: The port the server runs on (usually 3000).
- FRONTEND_URL: The URL of your frontend app (http://localhost:5173).

DEPLOYMENT ON VERCEL
--------------------
1. Connect your GitHub account to Vercel.
2. Vercel will find the vercel.json file and set up the site.
3. Add your backend environment variables in the Vercel settings.
4. Push your code to GitHub to put the site online.

PERMISSIONS (Who can do what)
-----------------------------
- Admins: Can view projects, create tasks, edit tasks, update status, and manage members.
- Members: Can view projects and update the status of tasks assigned to them.

DESIGN
------
The app uses a clean design with a cream background, dark ink text, and gold highlights. It works on computers, tablets, and phones.

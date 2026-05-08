import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.js';
import projectsRouter from './routes/projects.js';
import tasksRouter from './routes/tasks.js';
import dashboardRouter from './routes/dashboard.js';
import { verifyJWT } from './middleware/auth.js';

const app = express();

// Security headers
app.use(helmet());

// CORS — allow the frontend origin (set FRONTEND_URL env in production)
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(
  cors({
    origin: (origin, callback) => {
      // In production, we should be strict about origin when using cookies.
      // If no origin and not in dev, we might want to reject, but for now we enforce allowedOrigins.
      if (!origin && process.env.NODE_ENV !== 'production') return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Public routes
app.use('/api/auth', authRouter);

// Protected routes — verifyJWT runs first
app.use('/api/projects', verifyJWT, projectsRouter);
app.use('/api/projects', verifyJWT, dashboardRouter);
app.use('/api', verifyJWT, tasksRouter);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;

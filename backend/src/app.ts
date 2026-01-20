import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/ErrorHandler';
import projectsRouter from './routes/admin/Projects';
import clientsRouter from './routes/admin/Clients';
import tasksRouter from './routes/admin/Tasks';
import assignmentsRouter from './routes/admin/Assignments';

dotenv.config();

export const app = express();

// CORS configuration from environment variables
// LOCAL_CORS_ORIGINS: local dev origins (e.g., http://localhost:5173,http://localhost:5174)
// DEPLOY_CORS_ORIGINS: deployed frontend origins (e.g., https://admin.example.com,https://app.example.com)
const localOrigins = process.env.LOCAL_CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) || [];
const deployOrigins = process.env.DEPLOY_CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) || [];
const corsOrigins = [...localOrigins, ...deployOrigins];

app.use(
  cors({
    origin: corsOrigins.length > 0 ? corsOrigins : true, // Allow all if not configured (dev fallback)
    credentials: true,
  })
);

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Admin routes
app.use('/api/admin/projects', projectsRouter);
app.use('/api/admin/clients', clientsRouter);
app.use('/api/admin/tasks', tasksRouter);
app.use('/api/admin/assignments', assignmentsRouter);

// Error handler
app.use(errorHandler);



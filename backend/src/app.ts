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

// Global middleware
app.use(cors());
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



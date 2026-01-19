import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/ErrorHandler';
import attendanceRoutes from './routes/attendance.routes';
import timeLogsRoutes from './routes/timeLogs.routes';

const app = express();

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

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes
app.use('/api/attendance', attendanceRoutes);
app.use('/api/time-logs', timeLogsRoutes);

app.use(errorHandler);

export default app;

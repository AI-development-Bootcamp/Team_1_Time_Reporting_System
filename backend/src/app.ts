import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/ErrorHandler';
import timeLogsRoutes from './routes/TimeLogs';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes
app.use('/api/time-logs', timeLogsRoutes);

app.use(errorHandler);

export default app;

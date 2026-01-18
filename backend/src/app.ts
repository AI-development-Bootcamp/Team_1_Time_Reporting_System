import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/ErrorHandler';
import attendanceRoutes from './routes/Attendance';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes
app.use('/api/attendance', attendanceRoutes);

app.use(errorHandler);

export default app;

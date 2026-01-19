import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/ErrorHandler';
import projectsRouter from './routes/admin/Projects';
import clientsRouter from './routes/admin/Clients'; 

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Register admin routes
app.use('/api/admin/projects', projectsRouter);

app.use('/api/admin/clients', clientsRouter); 

app.use(errorHandler);
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
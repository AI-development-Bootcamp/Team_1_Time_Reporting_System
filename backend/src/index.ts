import dotenv from 'dotenv';
dotenv.config(); // Must run before importing app so env vars are available

import app from './app';

const port = process.env.PORT || 10000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

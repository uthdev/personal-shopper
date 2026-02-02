import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'customer-service' });
});

app.listen(PORT, () => {
  console.log(`Customer service running on port ${PORT}`);
});
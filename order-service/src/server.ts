import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'order-service' });
});

app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
});
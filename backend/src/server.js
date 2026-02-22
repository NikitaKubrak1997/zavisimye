import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { validateTelegramInitData } from './telegramAuth.js';

const app = express();
const port = process.env.PORT ?? 3001;
const botToken = process.env.BOT_TOKEN;
const apiUrl = process.env.API_URL;

app.use(cors({ origin: apiUrl || true }));
app.use(express.json());

app.post('/api/session/validate', (req, res) => {
  if (!botToken) {
    return res.status(500).json({ error: 'BOT_TOKEN is not configured' });
  }

  const authHeader = req.header('authorization') ?? '';
  if (!authHeader.startsWith('tma ')) {
    return res.status(401).json({ error: 'Missing tma authorization header' });
  }

  const initDataRaw = authHeader.slice(4).trim();
  const user = validateTelegramInitData(initDataRaw, botToken);

  if (!user) {
    return res.status(401).json({ error: 'initData validation failed' });
  }

  return res.json({ ok: true, user });
});

app.listen(port, () => {
  console.log(`Backend API is running on http://localhost:${port}`);
});

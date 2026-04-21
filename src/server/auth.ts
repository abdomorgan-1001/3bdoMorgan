import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getMasterDb, getUserDb } from './db.js';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-change-in-production';

const RegisterSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6),
});

authRouter.post('/register', async (req, res) => {
  try {
    const { username, password } = RegisterSchema.parse(req.body);
    
    // Check if user already exists
    const masterDb = await getMasterDb();
    const existingUser = await masterDb.get('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser) {
       res.status(400).json({ error: 'Username already exists' });
       return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await masterDb.run(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, passwordHash]
    );

    // Initialize their personal database file
    await getUserDb(username);

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input parameters' });
      return;
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = RegisterSchema.parse(req.body);
    
    const masterDb = await getMasterDb();
    const user = await masterDb.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '24h',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Must be true for SameSite=none
      sameSite: 'none', // Allow cross-origin iframe cookies
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ message: 'Logged in successfully', user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

authRouter.get('/me', async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string; userId: number };
    res.json({ user: decoded });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

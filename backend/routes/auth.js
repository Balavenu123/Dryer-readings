import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersPath = path.join(__dirname, '../config/users.json');

const JWT_SECRET = process.env.JWT_SECRET || 'dryer-scada-secret-key-change-in-prod';
const JWT_EXPIRES = '12h';

const router = express.Router();

// ── Helpers ────────────────────────────────────────────────────────────────

function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  } catch {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
}

// Middleware: verify JWT and attach user to req
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Middleware: only super admin
export function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
}

// ── Routes ─────────────────────────────────────────────────────────────────

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const users = readUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role }
  });
});

// GET /api/auth/me  — validate token & return current user
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// GET /api/auth/users  — list all monitor users (super admin only)
router.get('/users', requireAuth, requireSuperAdmin, (req, res) => {
  const users = readUsers();
  // Never send password hashes to the client
  res.json(users.map(u => ({ id: u.id, username: u.username, role: u.role, createdAt: u.createdAt })));
});

// POST /api/auth/users  — create a monitor user (super admin only)
router.post('/users', requireAuth, requireSuperAdmin, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const users = readUsers();
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: uuidv4(),
    username,
    passwordHash,
    role: 'monitor',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  res.status(201).json({ id: newUser.id, username: newUser.username, role: newUser.role, createdAt: newUser.createdAt });
});

// DELETE /api/auth/users/:id  — delete a monitor user (super admin only, cannot delete self)
router.delete('/users/:id', requireAuth, requireSuperAdmin, (req, res) => {
  const users = readUsers();
  const target = users.find(u => u.id === req.params.id);

  if (!target) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (target.role === 'superadmin') {
    return res.status(403).json({ error: 'Cannot delete super admin' });
  }

  const updated = users.filter(u => u.id !== req.params.id);
  saveUsers(updated);
  res.json({ success: true });
});

// PUT /api/auth/users/:id/password  — reset a monitor user password (super admin only)
router.put('/users/:id/password', requireAuth, requireSuperAdmin, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const users = readUsers();
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users[idx].passwordHash = await bcrypt.hash(password, 10);
  saveUsers(users);
  res.json({ success: true });
});

export default router;

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'mplad-sentinel-secret-2024';

// Demo authority user
const AUTHORITY_USER = {
  id: 'auth-001',
  username: 'authority',
  passwordHash: bcrypt.hashSync('sentinel2024', 10),
  role: 'authority',
  name: 'District Authority Officer',
};

export function login(req, res) {
  const { username, password } = req.body;
  if (username !== AUTHORITY_USER.username || !bcrypt.compareSync(password, AUTHORITY_USER.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { id: AUTHORITY_USER.id, role: AUTHORITY_USER.role, name: AUTHORITY_USER.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  res.json({ token, user: { id: AUTHORITY_USER.id, name: AUTHORITY_USER.name, role: AUTHORITY_USER.role } });
}

export function getProfile(req, res) {
  res.json({ user: req.user });
}

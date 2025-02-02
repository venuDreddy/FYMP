import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const { hash, compare } = bcryptjs;
const { sign } = jwt;
// Register a new user
export async function register(req, res) {
  const { username, password, role } = req.body;
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Create a new user
    const user = new User({ username, password: hashedPassword, role });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Login user
export async function login(req, res) {
  const { username, password } = req.body;
  try {
    // Find the user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // Set session
    req.session.user = user;

    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Logout user
export function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
}

// Get authenticated user data
export async function getUser(req, res) {
  try {
    const user = await User.findById(req.user.id).select('-password');
    return res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
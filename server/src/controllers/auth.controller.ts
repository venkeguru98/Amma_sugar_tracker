import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'amma_sugar_tracker_secret_jwt_key_2026';

export const register = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        targetMin: 70,
        targetMax: 140,
        diabetesType: 'Type 2'
      },
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        weight: user.weight,
        height: user.height,
        diabetesType: user.diabetesType,
        medicines: user.medicines ? JSON.parse(user.medicines) : [],
        targetMin: user.targetMin,
        targetMax: user.targetMax,
        themeSettings: user.themeSettings ? JSON.parse(user.themeSettings) : {},
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        weight: user.weight,
        height: user.height,
        diabetesType: user.diabetesType,
        medicines: user.medicines ? JSON.parse(user.medicines) : [],
        targetMin: user.targetMin,
        targetMax: user.targetMax,
        themeSettings: user.themeSettings ? JSON.parse(user.themeSettings) : {},
      },
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, age, weight, height, diabetesType, medicines, targetMin, targetMax, themeSettings } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name,
        age: age !== undefined ? parseInt(age) : undefined,
        weight: weight !== undefined ? parseFloat(weight) : undefined,
        height: height !== undefined ? parseFloat(height) : undefined,
        diabetesType,
        medicines: medicines !== undefined ? JSON.stringify(medicines) : undefined,
        targetMin: targetMin !== undefined ? parseFloat(targetMin) : undefined,
        targetMax: targetMax !== undefined ? parseFloat(targetMax) : undefined,
        themeSettings: themeSettings !== undefined ? JSON.stringify(themeSettings) : undefined,
      },
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        weight: user.weight,
        height: user.height,
        diabetesType: user.diabetesType,
        medicines: user.medicines ? JSON.parse(user.medicines) : [],
        targetMin: user.targetMin,
        targetMax: user.targetMax,
        themeSettings: user.themeSettings ? JSON.parse(user.themeSettings) : {},
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

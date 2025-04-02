import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user';
import { UserStatus } from '@prisma/client';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, role, name } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        if (existingUser.status === UserStatus.rejected) {
          return res.status(400).json({ 
            message: 'This email has been rejected. Please use a different email address.' 
          });
        }
        return res.status(400).json({ message: 'User already exists' });
      }

      // Validate role
      if (!['student', 'teacher'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Must be either student or teacher.' });
      }

      // Create new user
      const user = await UserModel.createUser(email, password, name, role);
      
      res.status(201).json({
        message: 'Registration successful. Waiting for admin approval.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        message: 'Registration failed. Please try again later.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check user status
      if (user.status === UserStatus.rejected) {
        return res.status(401).json({ 
          message: 'Your account has been rejected. Please contact the administrator.' 
        });
      }

      if (user.status === UserStatus.pending) {
        return res.status(401).json({ 
          message: 'Your account is pending approval. Please wait for admin approval.' 
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, role: user.role, name: user.name },
        process.env.JWT_SECRET || 'your_jwt_secret_key_here',
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        message: 'Login failed. Please try again later.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
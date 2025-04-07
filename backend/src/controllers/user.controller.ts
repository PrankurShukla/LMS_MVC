import { Request, Response } from 'express';
import { UserModel } from '../models/user';
import bcrypt from 'bcryptjs';

export class UserController {
  static async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req.user as any).userId;
      const { name, email, currentPassword, newPassword } = req.body;

      // Verify user exists
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // If trying to change password, verify current password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: 'Current password is required to set new password' });
        }

        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ message: 'Current password is incorrect' });
        }
      }

      // Check if email is already taken by another user
      if (email !== user.email) {
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: 'Email is already in use' });
        }
      }

      // Update user data
      const updateData: any = {
        name,
        email
      };

      // If changing password, add hashed new password
      if (newPassword) {
        updateData.password = await bcrypt.hash(newPassword, 10);
      }

      // Update user in database
      const updatedUser = await UserModel.updateProfile(userId, updateData);

      // Return updated user data without password
      res.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          status: updatedUser.status,
          createdAt: updatedUser.createdAt
        }
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ 
        message: 'Failed to update profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 
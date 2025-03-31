import { Request, Response } from 'express';
import { UserModel } from '../models/user';
import { UserStatus } from '@prisma/client';

export class AdminController {
  // Get all pending users
  static async getPendingUsers(req: Request, res: Response) {
    try {
      const pendingUsers = await UserModel.getPendingUsers();
      res.json(pendingUsers);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      res.status(500).json({ 
        message: 'Failed to fetch pending users',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get all users
  static async getAllUsers(req: Request, res: Response) {
    try {
      const users = await UserModel.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ 
        message: 'Failed to fetch users',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update user status (approve/reject)
  static async updateUserStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!Object.values(UserStatus).includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      // Check if user exists
      const user = await UserModel.findById(Number(id));
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update user status
      const updatedUser = await UserModel.updateStatus(Number(id), status);
      
      res.json({
        message: `User ${status} successfully`,
        user: updatedUser
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ 
        message: 'Failed to update user status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Delete user
  static async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if user exists
      const user = await UserModel.findById(Number(id));
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await UserModel.deleteUser(Number(id));
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ 
        message: 'Failed to delete user',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 
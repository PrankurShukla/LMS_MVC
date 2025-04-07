import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '@prisma/client';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
}

export class UserModel {
  static async createUser(email: string, password: string, name: string, role: UserRole): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      return await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
          status: role === 'admin' ? UserStatus.approved : UserStatus.pending,
        },
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Failed to find user');
    }
  }

  static async findById(id: number): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw new Error('Failed to find user');
    }
  }

  static async updateStatus(userId: number, status: UserStatus): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: { status },
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      throw new Error('Failed to update user status');
    }
  }

  static async updateProfile(userId: number, data: { name?: string; email?: string; password?: string }): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  static async getAllUsers() {
    try {
      return await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error('Failed to get all users');
    }
  }

  static async getPendingUsers() {
    try {
      return await prisma.user.findMany({
        where: {
          status: UserStatus.pending
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });
    } catch (error) {
      console.error('Error getting pending users:', error);
      throw new Error('Failed to get pending users');
    }
  }

  static async deleteUser(userId: number) {
    try {
      return await prisma.user.delete({
        where: { id: userId },
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }
} 
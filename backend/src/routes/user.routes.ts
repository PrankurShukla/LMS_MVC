import express from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Protected routes - require authentication
router.put('/profile', authenticateToken, UserController.updateProfile);

export default router; 
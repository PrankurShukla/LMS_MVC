import express from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication and admin authorization
router.use(authenticateToken, authorizeAdmin);

// Get all pending users
router.get('/pending-users', (req, res) => AdminController.getPendingUsers(req, res));

// Get all users
router.get('/users', (req, res) => AdminController.getAllUsers(req, res));

// Update user status (approve/reject)
router.put('/users/:id/status', (req, res) => AdminController.updateUserStatus(req, res));

// Delete user
router.delete('/users/:id', (req, res) => AdminController.deleteUser(req, res));

export default router; 
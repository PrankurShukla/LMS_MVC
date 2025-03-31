import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.middleware';
import { UserModel } from '../models/user';

const router = express.Router();
const authController = new AuthController();

// Public routes
router.post('/register', (req, res) => AuthController.register(req, res));
router.post('/login', (req, res) => AuthController.login(req, res));

// Protected routes
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Fetch complete user data from the database
    const user = await UserModel.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user data without password
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 
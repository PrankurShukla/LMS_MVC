import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import classRoutes from './routes/class.routes';
import userRoutes from './routes/user.routes';
import { authenticateToken, authorizeAdmin } from './middleware/auth.middleware';

const app = express();

app.use(cors());
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/admin', authenticateToken, authorizeAdmin, adminRoutes);
app.use('/api/classes', authenticateToken, classRoutes);
app.use('/api/users', authenticateToken, userRoutes);

export default app; 
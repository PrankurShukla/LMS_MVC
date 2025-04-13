import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import classRoutes from './routes/class.routes';
import userRoutes from './routes/user.routes';
import morgan from 'morgan';
import { authenticateToken, authorizeAdmin } from './middleware/auth.middleware';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint for Docker
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/admin', authenticateToken, authorizeAdmin, adminRoutes);
app.use('/api/classes', authenticateToken, classRoutes);
app.use('/api/users', authenticateToken, userRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the LMS API' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  // Handle Prisma errors
  if (err.code === 'P2002') {
    return res.status(400).json({ 
      message: 'A unique constraint would be violated on one of the fields.' 
    });
  }
  
  if (err.code === 'P2025') {
    return res.status(404).json({ 
      message: 'Record not found.' 
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      message: 'Invalid token.' 
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      message: 'Token expired.' 
    });
  }

  // Default error
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app; 
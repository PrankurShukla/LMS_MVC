import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

export const authorizeRoles = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as any;
      
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized - User not authenticated' });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({ 
          message: `Access denied. Role ${user.role} is not authorized to access this resource` 
        });
      }

      next();
    } catch (error) {
      console.error('Error in role authorization:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
};
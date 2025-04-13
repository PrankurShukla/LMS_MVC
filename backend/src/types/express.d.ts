import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      userId: number;
      email: string;
      role: UserRole;
    }
  }
} 
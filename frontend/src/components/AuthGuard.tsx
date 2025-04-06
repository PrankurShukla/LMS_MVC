'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'teacher' | 'student';
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Check authentication on mount and on route change
    checkAuth();

    // Add event listener for visibility change (back button navigation)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const checkAuth = () => {
    // Check if user was logged out
    const wasLoggedOut = sessionStorage.getItem('userLoggedOut');
    if (wasLoggedOut === 'true') {
      router.replace('/login');
      return;
    }

    // Get user data from localStorage
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      setAuthorized(false);
      router.replace('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      
      // Check if role is required and matches
      if (requiredRole && user.role !== requiredRole) {
        setAuthorized(false);
        router.replace('/login');
        return;
      }

      // Verify token with backend
      fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          setAuthorized(true);
        } else {
          // Token is invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setAuthorized(false);
          router.replace('/login');
        }
      })
      .catch(() => {
        // Error verifying token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthorized(false);
        router.replace('/login');
      });
    } catch (error) {
      // Error parsing user data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setAuthorized(false);
      router.replace('/login');
    }
  };

  return authorized ? <>{children}</> : null;
} 
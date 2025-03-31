'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';

export default function TeacherDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ name?: string } | null>(null);

  useEffect(() => {
    // Check if user is logged in and is a teacher
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/login');
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'teacher') {
        router.push('/login');
        return;
      }
      setCurrentUser(user);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader title="Teacher Dashboard" userName={currentUser?.name} />
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome to the Teacher Dashboard</h2>
          <p className="text-gray-600">
            This dashboard is currently under development. Soon, you'll be able to:
          </p>
          <ul className="mt-4 list-disc pl-5 space-y-2 text-gray-600">
            <li>Create and manage classes</li>
            <li>Add course materials</li>
            <li>Manage student enrollments</li>
            <li>Create assignments and grade submissions</li>
            <li>Communicate with students</li>
          </ul>
          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-700">
              Thank you for your patience as we develop this feature. Check back soon for updates!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
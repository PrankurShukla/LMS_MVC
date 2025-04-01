'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import DashboardHeader from '@/components/DashboardHeader';

interface ClassDetails {
  id: number;
  name: string;
  description: string;
  teacherId: number;
  createdAt: string;
  _count?: {
    enrollments: number;
  };
}

export default function TeacherClassDetail() {
  const params = useParams();
  const classId = params.id as string;
  const router = useRouter();
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
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
      fetchClassDetails(token, classId);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, [classId]);

  const fetchClassDetails = async (token: string, classId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClassDetails(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching class details:', error);
      toast.error('Failed to fetch class details');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <DashboardHeader title="Loading..." userName={currentUser?.name} />
          <div className="mt-8 text-center">Loading class details...</div>
        </div>
      </div>
    );
  }

  if (!classDetails) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <DashboardHeader title="Class Not Found" userName={currentUser?.name} />
          <div className="mt-8 text-center">
            <p className="text-red-500">Class not found or you don't have permission to view it.</p>
            <Link href="/teacher/dashboard" className="mt-4 inline-block text-blue-500 hover:text-blue-700">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <DashboardHeader title={classDetails.name} userName={currentUser?.name} />
          <Link href="/teacher/dashboard" className="text-blue-500 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Class Information</h2>
            <p className="text-gray-600 mb-6">{classDetails.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Class ID</h3>
                <p>{classDetails.id}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Created On</h3>
                <p>{new Date(classDetails.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link 
                href={`/teacher/classes/${classId}/enrollments`} 
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 p-4 rounded-lg text-center"
              >
                <h3 className="text-lg font-semibold mb-2">Enrollments</h3>
                <p>Manage student enrollments</p>
              </Link>
              <Link 
                href={`/teacher/classes/${classId}/materials`} 
                className="bg-purple-100 hover:bg-purple-200 text-purple-800 p-4 rounded-lg text-center"
              >
                <h3 className="text-lg font-semibold mb-2">Materials</h3>
                <p>Manage course materials</p>
              </Link>
              <Link 
                href={`/teacher/classes/${classId}/assignments`} 
                className="bg-green-100 hover:bg-green-200 text-green-800 p-4 rounded-lg text-center"
              >
                <h3 className="text-lg font-semibold mb-2">Assignments</h3>
                <p>Manage assignments and grades</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
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
  const [activeStudents, setActiveStudents] = useState(0);
  const [pendingEnrollments, setPendingEnrollments] = useState(0);

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
      fetchEnrollmentStats(token, classId);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, [classId]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

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

  const fetchEnrollmentStats = async (token: string, classId: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/${classId}/enrollments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const enrollments = response.data;
      const active = enrollments.filter((e: any) => e.status === 'approved').length;
      const pending = enrollments.filter((e: any) => e.status === 'pending').length;
      
      setActiveStudents(active);
      setPendingEnrollments(pending);
    } catch (error) {
      console.error('Error fetching enrollment stats:', error);
      toast.error('Failed to fetch enrollment statistics');
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/teacher/dashboard"
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">{classDetails?.name}</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>

        {/* Class Information Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Class Information</h2>
                <p className="text-gray-600">{classDetails?.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Created on</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(classDetails?.createdAt || '').toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Link 
                href={`/teacher/classes/${classId}/enrollments`} 
                className="group relative bg-white hover:bg-blue-50 border border-blue-100 rounded-xl p-6 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Enrollments</h3>
                    <p className="text-sm text-gray-600">Manage student enrollments</p>
                  </div>
                </div>
                <div className="absolute inset-0 border-2 border-transparent hover:border-blue-200 rounded-xl transition-colors duration-200" />
              </Link>

              <Link 
                href={`/teacher/classes/${classId}/materials`} 
                className="group relative bg-white hover:bg-purple-50 border border-purple-100 rounded-xl p-6 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Materials</h3>
                    <p className="text-sm text-gray-600">Manage course materials</p>
                  </div>
                </div>
                <div className="absolute inset-0 border-2 border-transparent hover:border-purple-200 rounded-xl transition-colors duration-200" />
              </Link>

              <Link 
                href={`/teacher/classes/${classId}/assignments`} 
                className="group relative bg-white hover:bg-green-50 border border-green-100 rounded-xl p-6 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Assignments</h3>
                    <p className="text-sm text-gray-600">Manage assignments and grades</p>
                  </div>
                </div>
                <div className="absolute inset-0 border-2 border-transparent hover:border-green-200 rounded-xl transition-colors duration-200" />
              </Link>

              <Link 
                href={`/teacher/classes/${classId}/students`} 
                className="group relative bg-white hover:bg-amber-50 border border-amber-100 rounded-xl p-6 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Students</h3>
                    <p className="text-sm text-gray-600">View and manage students</p>
                  </div>
                </div>
                <div className="absolute inset-0 border-2 border-transparent hover:border-amber-200 rounded-xl transition-colors duration-200" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <h3 className="text-2xl font-bold text-gray-900">{classDetails?._count?.enrollments || 0}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-green-600">Active Students</p>
                <h3 className="text-2xl font-bold text-green-700">{activeStudents}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-yellow-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-600">Pending Enrollments</p>
                <h3 className="text-2xl font-bold text-yellow-700">{pendingEnrollments}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
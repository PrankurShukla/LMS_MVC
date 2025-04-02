'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import DashboardHeader from '@/components/DashboardHeader';

interface Student {
  id: number;
  student: {
    id: number;
    name: string;
    email: string;
  };
  status: string;
}

export default function TeacherClassStudents() {
  const params = useParams();
  const classId = params.id as string;
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
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
      fetchStudents(token, classId);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, [classId]);

  const fetchStudents = async (token: string, classId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/${classId}/enrollments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
      setLoading(false);
    }
  };

  const handleStatusChange = async (enrollmentId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classes/enrollments/${enrollmentId}/status`,
        { status: newStatus === 'approved' ? 'approved' : 'rejected' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Student status updated successfully');
      fetchStudents(token!, classId);
    } catch (error) {
      console.error('Error updating student status:', error);
      toast.error('Failed to update student status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusAction = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Deactivate';
      case 'rejected':
      case 'pending':
        return 'Activate';
      default:
        return 'Activate';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <DashboardHeader title="Loading..." userName={currentUser?.name} />
          <div className="mt-8 text-center">Loading students...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <DashboardHeader title="Class Students" userName={currentUser?.name} />
          <Link href={`/teacher/classes/${classId}`} className="text-blue-500 hover:text-blue-700">
            Back to Class
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Students</h3>
            <p className="text-3xl font-bold text-gray-700">{students.length}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Active Students</h3>
            <p className="text-3xl font-bold text-green-700">
              {students.filter(s => s.status === 'approved').length}
            </p>
          </div>
          <div className="bg-red-50 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Inactive Students</h3>
            <p className="text-3xl font-bold text-red-700">
              {students.filter(s => s.status === 'rejected').length}
            </p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Student List</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className={student.status === 'rejected' ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">{student.student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{student.student.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(student.status)}`}>
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleStatusChange(
                            student.id,
                            student.status === 'approved' ? 'rejected' : 'approved'
                          )}
                          className={`${
                            student.status === 'approved' 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {getStatusAction(student.status)}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
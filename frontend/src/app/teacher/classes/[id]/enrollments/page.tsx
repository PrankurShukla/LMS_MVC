'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import DashboardHeader from '@/components/DashboardHeader';

interface Enrollment {
  id: number;
  status: string;
  enrolledAt: string;
  student: {
    id: number;
    name: string;
    email: string;
  };
}

interface ClassDetails {
  id: number;
  name: string;
  description?: string;
}

export default function TeacherClassEnrollments() {
  const params = useParams();
  const classId = params.id as string;
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<Enrollment[]>([]);
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
      fetchEnrollments(token, classId);
      fetchPendingEnrollments(token, classId);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, [classId]);

  const fetchClassDetails = async (token: string, classId: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClassDetails(response.data);
    } catch (error) {
      console.error('Error fetching class details:', error);
      toast.error('Failed to fetch class details');
    }
  };

  const fetchEnrollments = async (token: string, classId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/${classId}/enrollments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Filter to only show approved enrollments in the main list
      const approvedEnrollments = response.data.filter((enrollment: Enrollment) => enrollment.status === 'approved');
      setEnrollments(approvedEnrollments);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to fetch enrollments');
      setLoading(false);
    }
  };

  const fetchPendingEnrollments = async (token: string, classId: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/${classId}/enrollments/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingEnrollments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pending enrollments:', error);
      toast.error('Failed to fetch pending enrollments');
      setLoading(false);
    }
  };

  const updateEnrollmentStatus = async (enrollmentId: number, status: 'approved' | 'rejected') => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classes/enrollments/${enrollmentId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Enrollment ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      
      // Refresh enrollments
      fetchEnrollments(token as string, classId);
      fetchPendingEnrollments(token as string, classId);
    } catch (error) {
      console.error('Error updating enrollment status:', error);
      toast.error('Failed to update enrollment status');
    }
  };

  if (loading && !classDetails) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <DashboardHeader title="Loading..." userName={currentUser?.name} />
          <div className="mt-8 text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <DashboardHeader title={`${classDetails?.name} - Enrollments`} userName={currentUser?.name} />
          <Link 
            href={`/teacher/classes/${classId}`} 
            className="text-blue-500 hover:text-blue-700"
          >
            Back to Class
          </Link>
        </div>

        {/* Pending Enrollments Section */}
        {pendingEnrollments.length > 0 && (
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-100">
              <h2 className="text-xl font-bold text-yellow-800">Pending Enrollment Requests</h2>
              <p className="text-sm text-yellow-600">Review and approve/reject student enrollment requests</p>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requested On
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingEnrollments.map((enrollment) => (
                      <tr key={enrollment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {enrollment.student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {enrollment.student.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => updateEnrollmentStatus(enrollment.id, 'approved')}
                              className="bg-green-500 hover:bg-green-700 text-white text-sm font-bold py-1 px-3 rounded"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => updateEnrollmentStatus(enrollment.id, 'rejected')}
                              className="bg-red-500 hover:bg-red-700 text-white text-sm font-bold py-1 px-3 rounded"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Enrolled Students Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-bold">Enrolled Students</h2>
            <p className="text-sm text-gray-500">Students who are currently enrolled in this class</p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-6">Loading enrollments...</div>
            ) : enrollments.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">No students are enrolled in this class yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enrolled On
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {enrollments.map((enrollment) => (
                      <tr key={enrollment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {enrollment.student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {enrollment.student.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
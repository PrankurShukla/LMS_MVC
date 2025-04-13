'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { getApiUrl } from '@/lib/apiUrl';
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
  const [searchTerm, setSearchTerm] = useState('');

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
      const response = await axios.get(`${getApiUrl()}/api/classes/${classId}`, {
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
      const response = await axios.get(`${getApiUrl()}/api/classes/${classId}/enrollments`, {
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
      const response = await axios.get(`${getApiUrl()}/api/classes/${classId}/enrollments/pending`, {
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

  const handleEnrollmentAction = async (enrollmentId: number, status: 'approved' | 'rejected') => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${getApiUrl()}/api/classes/enrollments/${enrollmentId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Enrollment ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      fetchPendingEnrollments(token as string, classId);
    } catch (error) {
      console.error('Error updating enrollment status:', error);
      toast.error('Failed to update enrollment status');
    }
  };

  const filteredRequests = pendingEnrollments.filter(enrollment => 
    enrollment.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !classDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading enrollment requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pending Enrollment Requests</h1>
              <p className="mt-2 text-gray-600">Review and manage student enrollment requests</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/teacher/classes/${classId}`}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Class
              </Link>
              <Link
                href={`/teacher/classes/${classId}/students`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                View Enrolled Students
              </Link>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Requests</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name or email..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg 
                className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pending Requests List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending requests</h3>
              <p className="text-gray-500">
                {searchTerm ? "No requests match your search" : "There are no pending enrollment requests"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
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
                  {filteredRequests.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {enrollment.student.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{enrollment.student.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{enrollment.student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEnrollmentAction(enrollment.id, 'approved')}
                            className="px-3 py-1 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-900 rounded-md transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleEnrollmentAction(enrollment.id, 'rejected')}
                            className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-900 rounded-md transition-colors"
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
          )}
        </div>
      </div>
    </div>
  );
} 
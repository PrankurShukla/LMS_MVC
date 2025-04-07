'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface Class {
  id: number;
  name: string;
  description: string;
  teacher: {
    id: number;
    name: string;
  };
}

interface Enrollment {
  id: number;
  status: string;
  class: Class;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ name?: string, id?: number } | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  useEffect(() => {
    // Check if user is logged in and is a student
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/login');
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'student') {
        router.push('/login');
        return;
      }
      setCurrentUser(user);
      fetchStudentEnrollments(token);
      fetchAvailableClasses(token);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, []);

  const fetchStudentEnrollments = async (token: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/student/my-enrollments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnrollments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to fetch your enrollments');
      setLoading(false);
    }
  };

  const fetchAvailableClasses = async (token: string) => {
    try {
      // Get all classes
      const allClassesResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Get my enrollments (including rejected ones)
      const myEnrollmentsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/student/my-enrollments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Extract list of enrolled class IDs with approved or pending status
      const enrolledOrPendingClassIds = myEnrollmentsResponse.data
        .filter((enrollment: Enrollment) => enrollment.status === 'approved' || enrollment.status === 'pending')
        .map((enrollment: Enrollment) => enrollment.class.id);
      
      // Filter out classes that the student is already enrolled in or has pending requests
      const availableClasses = allClassesResponse.data.filter((cls: Class) => {
        return !enrolledOrPendingClassIds.includes(cls.id);
      });
      
      setAvailableClasses(availableClasses);
    } catch (error) {
      console.error('Error fetching available classes:', error);
      toast.error('Failed to fetch available classes');
    }
  };

  const requestEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;
    
    try {
      const token = localStorage.getItem('token');
      setLoading(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classes/enroll`,
        { classId: selectedClassId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Show appropriate message based on the response
      if (response.data.message) {
        toast.success(response.data.message);
      } else {
        toast.success('Enrollment request sent successfully');
      }
      
      setShowEnrollModal(false);
      setSelectedClassId(null);
      
      // Refresh data
      fetchStudentEnrollments(token as string);
      fetchAvailableClasses(token as string);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      console.error('Error requesting enrollment:', error);
      
      // Display appropriate error message
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to request enrollment');
      }
    }
  };

  // Group enrollments by status
  const approvedEnrollments = enrollments.filter(e => e.status === 'approved');
  const pendingEnrollments = enrollments.filter(e => e.status === 'pending');
  const rejectedEnrollments = enrollments.filter(e => e.status === 'rejected');

  const handleSignOut = () => {
    if (confirm('Are you sure you want to sign out?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Add a flag to prevent browser back button navigation
      sessionStorage.setItem('userLoggedOut', 'true');
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <DashboardHeader title="Student Dashboard" userName={currentUser?.name} />
          <button
            onClick={() => setShowEnrollModal(true)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={availableClasses.length === 0}
          >
            Enroll in New Class
          </button>
        </div>
        
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold text-lg mb-2">Enrolled Classes</h2>
            <p className="text-3xl font-bold">{approvedEnrollments.length}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold text-lg mb-2">Pending Enrollments</h2>
            <p className="text-3xl font-bold">{pendingEnrollments.length}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold text-lg mb-2">Available Classes</h2>
            <p className="text-3xl font-bold">{availableClasses.length}</p>
          </div>
        </div>

        {/* Approved Enrollments / My Classes */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">My Classes</h2>
          {loading ? (
            <p>Loading classes...</p>
          ) : approvedEnrollments.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">You are not enrolled in any classes yet.</p>
              <button
                onClick={() => setShowEnrollModal(true)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                disabled={availableClasses.length === 0}
              >
                Browse Available Classes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <h3 className="text-lg font-bold mb-2 truncate">{enrollment.class.name}</h3>
                    <p className="text-gray-600 mb-4 h-12 overflow-hidden">
                      {enrollment.class.description}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Teacher: {enrollment.class.teacher.name}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Link 
                        href={`/student/classes/${enrollment.class.id}`}
                        className="bg-blue-500 hover:bg-blue-700 text-white text-center font-bold py-1 px-3 rounded text-sm"
                      >
                        View Class
                      </Link>
                      <Link 
                        href={`/student/classes/${enrollment.class.id}/materials`}
                        className="bg-purple-500 hover:bg-purple-700 text-white text-center font-bold py-1 px-3 rounded text-sm"
                      >
                        Materials
                      </Link>
                      <Link 
                        href={`/student/classes/${enrollment.class.id}/assignments`}
                        className="bg-green-500 hover:bg-green-700 text-white text-center font-bold py-1 px-3 rounded text-sm"
                      >
                        Assignments
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Pending Enrollments Section */}
        {pendingEnrollments.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Pending Enrollments</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingEnrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {enrollment.class.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {enrollment.class.teacher.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Rejected Enrollments Section */}
        {rejectedEnrollments.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Rejected Enrollments</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rejectedEnrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {enrollment.class.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {enrollment.class.teacher.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Rejected
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Enroll in Class Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Enroll in a Class</h2>
            {availableClasses.length === 0 ? (
              <p className="text-gray-500 mb-4">No available classes to enroll in at the moment.</p>
            ) : (
              <form onSubmit={requestEnrollment}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="class">
                    Select a Class
                  </label>
                  <select
                    id="class"
                    value={selectedClassId || ''}
                    onChange={(e) => setSelectedClassId(Number(e.target.value))}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="">-- Select a Class --</option>
                    {availableClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} (by {cls.teacher.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowEnrollModal(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    disabled={!selectedClassId}
                  >
                    Request Enrollment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
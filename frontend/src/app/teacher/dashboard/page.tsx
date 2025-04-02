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
  _count: {
    enrollments: number;
  };
  createdAt: string;
}

interface Enrollment {
  id: number;
  status: string;
  student: {
    id: number;
    name: string;
    email: string;
  };
  classId: number;
}

interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  pendingEnrollments: number;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ name?: string, id?: number } | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewClassModal, setShowNewClassModal] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '',
    description: '',
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalClasses: 0,
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    pendingEnrollments: 0
  });

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
      fetchTeacherClasses(token);
      fetchDashboardStats(token);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, []);

  const fetchTeacherClasses = async (token: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/teacher/my-classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(response.data);
      setLoading(false);
      
      // After fetching classes, get pending enrollments for each class
      fetchPendingEnrollments(token, response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to fetch your classes');
      setLoading(false);
    }
  };

  const fetchPendingEnrollments = async (token: string, classesList: Class[]) => {
    try {
      if (classesList.length === 0) return;
      
      const pendingEnrollmentsPromises = classesList.map(cls => 
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/${cls.id}/enrollments/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      const responses = await Promise.all(pendingEnrollmentsPromises);
      const allPendingEnrollments = responses.flatMap((response, index) => {
        // Add classId to each enrollment for reference
        return response.data.map((enrollment: any) => ({
          ...enrollment,
          classId: classesList[index].id
        }));
      });
      
      setPendingEnrollments(allPendingEnrollments);
    } catch (error) {
      console.error('Error fetching pending enrollments:', error);
      toast.error('Failed to fetch pending enrollments');
    }
  };

  const fetchDashboardStats = async (token: string) => {
    try {
      // Get all classes first
      const classesResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/teacher/my-classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      let totalStudents = 0;
      let activeStudents = 0;
      let inactiveStudents = 0;
      let pendingEnrollments = 0;

      // For each class, get enrollment details
      for (const classItem of classesResponse.data) {
        const enrollmentsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/classes/${classItem.id}/enrollments`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const enrollments = enrollmentsResponse.data;
        totalStudents += enrollments.length;
        activeStudents += enrollments.filter((e: any) => e.status === 'approved').length;
        inactiveStudents += enrollments.filter((e: any) => e.status === 'rejected').length;
        pendingEnrollments += enrollments.filter((e: any) => e.status === 'pending').length;
      }

      setStats({
        totalClasses: classesResponse.data.length,
        totalStudents,
        activeStudents,
        inactiveStudents,
        pendingEnrollments
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to fetch dashboard statistics');
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classes`,
        newClass,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Class created successfully');
      setShowNewClassModal(false);
      setNewClass({ name: '', description: '' });
      // Fetch both classes and stats to update the UI
      await Promise.all([
        fetchTeacherClasses(token as string),
        fetchDashboardStats(token as string)
      ]);
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error('Failed to create class');
    }
  };

  const handleEnrollmentStatusUpdate = async (enrollmentId: number, status: 'approved' | 'rejected') => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classes/enrollments/${enrollmentId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Enrollment ${status}`);
      
      // Update UI by removing the enrollment from pending list
      setPendingEnrollments(prev => prev.filter(enrollment => enrollment.id !== enrollmentId));
      
      // Refresh class enrollment counts if approved
      if (status === 'approved') {
        fetchTeacherClasses(token as string);
      }
    } catch (error) {
      console.error(`Error ${status} enrollment:`, error);
      toast.error(`Failed to ${status} enrollment`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <DashboardHeader title="Loading..." userName={currentUser?.name} />
          <div className="mt-8 text-center">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <DashboardHeader title="Teacher Dashboard" userName={currentUser?.name} />
          <button
            onClick={() => setShowNewClassModal(true)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Create New Class
          </button>
        </div>
        
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold text-lg mb-2">Total Classes</h2>
            <p className="text-3xl font-bold">{stats.totalClasses}</p>
          </div>
          <div className="bg-green-50 p-4 rounded shadow">
            <h2 className="font-semibold text-lg mb-2">Active Students</h2>
            <p className="text-3xl font-bold">{stats.activeStudents}</p>
          </div>
          <div className="bg-red-50 p-4 rounded shadow">
            <h2 className="font-semibold text-lg mb-2">Inactive Students</h2>
            <p className="text-3xl font-bold">{stats.inactiveStudents}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded shadow">
            <h2 className="font-semibold text-lg mb-2">Pending Enrollments</h2>
            <p className="text-3xl font-bold">{stats.pendingEnrollments}</p>
          </div>
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
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingEnrollments.map((enrollment) => {
                    const classInfo = classes.find(c => c.id === enrollment.classId);
                    return (
                      <tr key={enrollment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {enrollment.student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {enrollment.student.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {classInfo?.name || 'Unknown Class'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleEnrollmentStatusUpdate(enrollment.id, 'approved')}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded mr-2"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleEnrollmentStatusUpdate(enrollment.id, 'rejected')}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Classes Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">My Classes</h2>
          {loading ? (
            <p>Loading classes...</p>
          ) : classes.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">You haven't created any classes yet.</p>
              <button
                onClick={() => setShowNewClassModal(true)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Create Your First Class
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((cls) => (
                <div key={cls.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <h3 className="text-lg font-bold mb-2 truncate">{cls.name}</h3>
                    <p className="text-gray-600 mb-4 h-12 overflow-hidden">
                      {cls.description}
                    </p>
                    <div className="flex justify-between text-sm mb-4">
                      <span className="text-gray-500">
                        {cls._count?.enrollments || 0} Students
                      </span>
                      <span className="text-gray-500">
                        Created: {new Date(cls.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link 
                        href={`/teacher/classes/${cls.id}`}
                        className="bg-blue-500 hover:bg-blue-700 text-white text-center font-bold py-1 px-3 rounded text-sm"
                      >
                        Manage
                      </Link>
                      <Link 
                        href={`/teacher/classes/${cls.id}/materials`}
                        className="bg-purple-500 hover:bg-purple-700 text-white text-center font-bold py-1 px-3 rounded text-sm"
                      >
                        Materials
                      </Link>
                      <Link 
                        href={`/teacher/classes/${cls.id}/assignments`}
                        className="bg-green-500 hover:bg-green-700 text-white text-center font-bold py-1 px-3 rounded text-sm"
                      >
                        Assignments
                      </Link>
                      <Link 
                        href={`/teacher/classes/${cls.id}/students`}
                        className="bg-amber-500 hover:bg-amber-700 text-white text-center font-bold py-1 px-3 rounded text-sm"
                      >
                        Students
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Class Modal */}
      {showNewClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Class</h2>
            <form onSubmit={handleCreateClass}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Class Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  value={newClass.description}
                  onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows={4}
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewClassModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
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
  uniqueStudents: number;
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
    pendingEnrollments: 0,
    uniqueStudents: 0
  });
  const [showUserMenu, setShowUserMenu] = useState(false);

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
      let uniqueStudentIds = new Set<number>();

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
        
        // Add student IDs to the set to count unique students
        enrollments.forEach((enrollment: any) => {
          if (enrollment.student && enrollment.student.id) {
            uniqueStudentIds.add(enrollment.student.id);
          }
        });
      }

      setStats({
        totalClasses: classesResponse.data.length,
        totalStudents,
        activeStudents,
        inactiveStudents,
        pendingEnrollments,
        uniqueStudents: uniqueStudentIds.size
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
      fetchTeacherClasses(token as string);
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error('Failed to create class');
    }
  };

  const handleEnrollmentStatusUpdate = async (enrollmentId: number, status: 'approved' | 'rejected') => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found');
        router.push('/login');
        return;
      }

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classes/enrollments/${enrollmentId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Find the enrollment that was updated
      const updatedEnrollment = pendingEnrollments.find(e => e.id === enrollmentId);
      if (!updatedEnrollment) return;
      
      // Update stats immediately
      setStats(prevStats => ({
        ...prevStats,
        pendingEnrollments: prevStats.pendingEnrollments - 1,
        activeStudents: status === 'approved' ? prevStats.activeStudents + 1 : prevStats.activeStudents,
        inactiveStudents: status === 'rejected' ? prevStats.inactiveStudents + 1 : prevStats.inactiveStudents
      }));
      
      // Remove from pending enrollments list
      setPendingEnrollments(prev => prev.filter(enrollment => enrollment.id !== enrollmentId));
      
      // Update the class count in the classes list
      if (status === 'approved') {
        setClasses(prevClasses => 
          prevClasses.map(cls => 
            cls.id === updatedEnrollment.classId 
              ? { 
                  ...cls, 
                  _count: { 
                    ...cls._count, 
                    enrollments: (cls._count?.enrollments || 0) + 1 
                  } 
                }
              : cls
          )
        );
      }
      
      toast.success(`Student ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      
      // Refresh all data in the background to ensure consistency
      fetchDashboardStats(token);
      fetchTeacherClasses(token);
    } catch (error: any) {
      console.error(`Error ${status} enrollment:`, error);
      toast.error(error.response?.data?.message || `Failed to ${status} student`);
      
      const token = sessionStorage.getItem('token');
      if (token) {
        // Refresh data to ensure UI is in sync with server
        fetchDashboardStats(token);
        fetchTeacherClasses(token);
      }
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center">
          <DashboardHeader title="Teacher Dashboard" userName={currentUser?.name} />
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowNewClassModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Class
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                  {currentUser?.name ? currentUser.name[0].toUpperCase() : 'U'}
                </div>
                <span className="font-medium">{currentUser?.name}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10 border border-gray-100">
                  <Link
                    href="/teacher/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-8">
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200 border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Classes</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalClasses}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200 border border-green-100">
            <h3 className="text-sm font-medium text-green-600 mb-1">Active Students</h3>
            <p className="text-3xl font-bold text-green-700">{stats.activeStudents}</p>
          </div>
          
          <div className="bg-red-50 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200 border border-red-100">
            <h3 className="text-sm font-medium text-red-600 mb-1">Inactive Students</h3>
            <p className="text-3xl font-bold text-red-700">{stats.inactiveStudents}</p>
          </div>
          
          <div className="bg-yellow-50 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200 border border-yellow-100">
            <h3 className="text-sm font-medium text-yellow-600 mb-1">Pending Enrollments</h3>
            <p className="text-3xl font-bold text-yellow-700">{stats.pendingEnrollments}</p>
          </div>

          <div className="bg-blue-50 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200 border border-blue-100">
            <h3 className="text-sm font-medium text-blue-600 mb-1">Unique Students</h3>
            <p className="text-3xl font-bold text-blue-700">{stats.uniqueStudents}</p>
          </div>
        </div>

        {/* My Classes Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">My Classes</h2>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
                <p className="mt-2 text-gray-500">Loading your classes...</p>
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No classes created yet</h3>
                <p className="text-gray-500 mb-6">Get started by creating your first class</p>
                <button
                  onClick={() => setShowNewClassModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Your First Class
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => (
                  <div key={cls.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{cls.name}</h3>
                      <p className="text-gray-600 mb-4 h-12 line-clamp-2">{cls.description}</p>
                      <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {cls._count?.enrollments || 0} Students
                        </span>
                        <span>Created: {new Date(cls.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Link 
                          href={`/teacher/classes/${cls.id}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md transition-colors duration-200"
                        >
                          Manage
                        </Link>
                        <Link 
                          href={`/teacher/classes/${cls.id}/materials`}
                          className="bg-gray-600 hover:bg-gray-700 text-white text-center py-2 px-4 rounded-md transition-colors duration-200"
                        >
                          Materials
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Create New Class</h2>
                <button
                  onClick={() => setShowNewClassModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreateClass}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                    Class Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={newClass.description}
                    onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewClassModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
                  >
                    Create Class
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
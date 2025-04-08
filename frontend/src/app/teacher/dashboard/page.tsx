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
      const token = localStorage.getItem('token');
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
      
      const token = localStorage.getItem('token');
      if (token) {
        // Refresh data to ensure UI is in sync with server
        fetchDashboardStats(token);
        fetchTeacherClasses(token);
      }
    }
  };

  const handleSignOut = () => {
    if (confirm('Are you sure you want to sign out?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Add a flag to prevent browser back button navigation
      sessionStorage.setItem('userLoggedOut', 'true');
      router.push('/login');
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {currentUser?.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowNewClassModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Class
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium shadow-inner">
                  {currentUser?.name ? currentUser.name[0].toUpperCase() : 'U'}
                </div>
                <span className="font-medium">{currentUser?.name}</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10 border border-gray-100 animate-fadeIn">
                  <Link
                    href="/teacher/profile"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 cursor-pointer gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 cursor-pointer gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Classes</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalClasses}</h3>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-green-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-green-600">Active Students</p>
                <h3 className="text-2xl font-bold text-green-700">{stats.activeStudents}</h3>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-red-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-red-600">Inactive Students</p>
                <h3 className="text-2xl font-bold text-red-700">{stats.inactiveStudents}</h3>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-yellow-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-600">Pending Enrollments</p>
                <h3 className="text-2xl font-bold text-yellow-700">{stats.pendingEnrollments}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-blue-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600">Unique Students</p>
                <h3 className="text-2xl font-bold text-blue-700">{stats.uniqueStudents}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* My Classes Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">My Classes</h2>
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
                  <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes created yet</h3>
                <p className="text-gray-500 mb-6">Get started by creating your first class</p>
                <button
                  onClick={() => setShowNewClassModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-all duration-200 inline-flex items-center gap-2 shadow-sm hover:shadow-md"
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
                  <div key={cls.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">{cls.name}</h3>
                        <span className="text-xs font-medium text-gray-500 whitespace-nowrap ml-2">
                          {new Date(cls.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4 text-sm line-clamp-2">{cls.description}</p>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {cls._count?.enrollments || 0} Students
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Link 
                          href={`/teacher/classes/${cls.id}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Manage
                        </Link>
                        <Link 
                          href={`/teacher/classes/${cls.id}/materials`}
                          className="bg-gray-600 hover:bg-gray-700 text-white text-center py-2 px-4 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
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

        {/* Pending Enrollment Requests Section */}
        {pendingEnrollments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-yellow-100 mt-8">
            <div className="px-6 py-4 border-b border-yellow-100 bg-yellow-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <svg className="w-6 h-6 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pending Enrollment Requests
                </h2>
                <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  {pendingEnrollments.length} Request{pendingEnrollments.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingEnrollments.map((enrollment) => {
                      // Find the corresponding class name
                      const className = classes.find(c => c.id === enrollment.classId)?.name || 'Unknown Class';
                      
                      return (
                        <tr key={enrollment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                                {enrollment.student.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{enrollment.student.name}</div>
                                <div className="text-sm text-gray-500">{enrollment.student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{className}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEnrollmentStatusUpdate(enrollment.id, 'approved')}
                                className="text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-1 transition-colors duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Approve
                              </button>
                              <button
                                onClick={() => handleEnrollmentStatusUpdate(enrollment.id, 'rejected')}
                                className="text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center gap-1 transition-colors duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Create Class Modal */}
        {showNewClassModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create New Class</h2>
                <button
                  onClick={() => setShowNewClassModal(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                    Class Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={newClass.description}
                    onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    rows={4}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewClassModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
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
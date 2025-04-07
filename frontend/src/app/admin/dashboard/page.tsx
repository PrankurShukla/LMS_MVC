'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';
// Import will be fixed later
// import AuthGuard from '@/components/AuthGuard';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<{ name?: string } | null>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    pendingCount: 0,
    totalUsers: 0,
    approvedCount: 0,
    rejectedCount: 0,
    studentPercentage: 0,
    teacherPercentage: 0,
    adminPercentage: 0
  });

  useEffect(() => {
    // Check if user is logged in and is admin
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        router.push('/login');
        return false;
      }
      
      try {
        const user = JSON.parse(userStr);
        if (user.role !== 'admin') {
          router.push('/login');
          return false;
        }
        setCurrentUser(user);
        return true;
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/login');
        return false;
      }
    };
    
    if (checkAuth()) {
      fetchUsers();
      fetchPendingUsers();
    }
  }, []);

  // Calculate statistics whenever users change
  useEffect(() => {
    const totalUsers = users.length;
    const studentCount = users.filter(user => user.role === 'student').length;
    const teacherCount = users.filter(user => user.role === 'teacher').length;
    const adminCount = users.filter(user => user.role === 'admin').length;
    const pendingCount = pendingUsers.length;
    const approvedCount = users.filter(user => user.status === 'approved').length;
    const rejectedCount = users.filter(user => user.status === 'rejected').length;

    // Calculate percentages (avoid division by zero)
    const studentPercentage = totalUsers > 0 ? Math.round((studentCount / totalUsers) * 100) : 0;
    const teacherPercentage = totalUsers > 0 ? Math.round((teacherCount / totalUsers) * 100) : 0;
    const adminPercentage = totalUsers > 0 ? Math.round((adminCount / totalUsers) * 100) : 0;

    setStats({
      totalStudents: studentCount,
      totalTeachers: teacherCount,
      pendingCount: pendingCount,
      totalUsers: totalUsers,
      approvedCount,
      rejectedCount,
      studentPercentage,
      teacherPercentage,
      adminPercentage
    });
  }, [users, pendingUsers]);

  // Add protection against browser back button after logout
  useEffect(() => {
    // This function will be called when the component mounts and when it updates
    const handleBeforeUnload = () => {
      // Store a timestamp to check if we're returning to the page
      sessionStorage.setItem('lastAdminDashboardExit', Date.now().toString());
    };

    // This function will run when the page is hidden (e.g., navigating away)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleBeforeUnload();
      } else if (document.visibilityState === 'visible') {
        // When page becomes visible again (e.g., returning with back button)
        const lastExit = sessionStorage.getItem('lastAdminDashboardExit');
        if (lastExit) {
          // If we have a record of leaving this page, check authentication again
          const token = localStorage.getItem('token');
          const userStr = localStorage.getItem('user');
          
          if (!token || !userStr) {
            router.push('/login');
          } else {
            try {
              const user = JSON.parse(userStr);
              if (user.role !== 'admin') {
                router.push('/login');
              } else {
                // Still authenticated, refresh data
                fetchUsers();
                fetchPendingUsers();
              }
            } catch (error) {
              router.push('/login');
            }
          }
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchPendingUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/pending-users', {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch pending users');
      }
      
      const data = await response.json();
      setPendingUsers(data);
    } catch (err: any) {
      console.error('Error fetching pending users:', err);
      setError(err.message || 'Failed to fetch pending users. Please try again.');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users. Please try again.');
    }
  };

  const handleStatusUpdate = async (userId: number, status: 'approved' | 'rejected') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update user status');

      // Refresh the lists
      fetchUsers();
      fetchPendingUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete user');

      // Refresh the lists
      fetchUsers();
      fetchPendingUsers();
    } catch (err: any) {
      setError(err.message);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeader title="Admin Dashboard" userName={currentUser?.name} />
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 bg-opacity-50">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Total Students</h3>
                <p className="mt-1 text-3xl font-semibold text-blue-600">{stats.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 bg-opacity-50">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Total Teachers</h3>
                <p className="mt-1 text-3xl font-semibold text-green-600">{stats.totalTeachers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 bg-opacity-50">
                <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Pending Approvals</h3>
                <p className="mt-1 text-3xl font-semibold text-yellow-600">{stats.pendingCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Distribution */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">User Distribution</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* By Role */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">By Role</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Students</span>
                    <span className="text-sm font-medium text-gray-700">{stats.studentPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${stats.studentPercentage}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Teachers</span>
                    <span className="text-sm font-medium text-gray-700">{stats.teacherPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${stats.teacherPercentage}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Admins</span>
                    <span className="text-sm font-medium text-gray-700">{stats.adminPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${stats.adminPercentage}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* By Status */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">By Status</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-green-600">{stats.approvedCount}</p>
                  <p className="text-sm text-gray-600">Approved</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-red-600">{stats.rejectedCount}</p>
                  <p className="text-sm text-gray-600">Rejected</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approvals Table */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Pending Approvals</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleStatusUpdate(user.id, 'approved')}
                        className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md hover:bg-green-100 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(user.id, 'rejected')}
                        className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md hover:bg-red-100 transition-colors"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No pending approvals
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Users Table */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                        ${user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${user.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this user?')) {
                            handleDeleteUser(user.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 text-red-700 p-4 rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 
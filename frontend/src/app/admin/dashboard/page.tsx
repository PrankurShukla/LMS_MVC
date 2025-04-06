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
      const token = sessionStorage.getItem('token');
      const userStr = sessionStorage.getItem('user');
      const tokenExpiration = sessionStorage.getItem('tokenExpiration');
      
      // Check token expiration
      if (tokenExpiration && new Date().getTime() > parseInt(tokenExpiration)) {
        sessionStorage.clear();
        router.push('/login');
        return false;
      }
      
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
          const token = sessionStorage.getItem('token');
          const userStr = sessionStorage.getItem('user');
          const tokenExpiration = sessionStorage.getItem('tokenExpiration');
          
          // Check token expiration
          if (tokenExpiration && new Date().getTime() > parseInt(tokenExpiration)) {
            sessionStorage.clear();
            router.push('/login');
            return;
          }
          
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
    const token = sessionStorage.getItem('token');
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
          sessionStorage.clear();
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
          sessionStorage.clear();
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
      const token = sessionStorage.getItem('token');
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
      const token = sessionStorage.getItem('token');
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

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader title="Admin Dashboard" userName={currentUser?.name} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white shadow rounded-lg p-6 flex items-center">
            <div className="rounded-full bg-blue-100 p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalStudents}</div>
              <div className="text-sm text-gray-500">Total Students</div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 flex items-center">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalTeachers}</div>
              <div className="text-sm text-gray-500">Total Teachers</div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 flex items-center">
            <div className="rounded-full bg-yellow-100 p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats.pendingCount}</div>
              <div className="text-sm text-gray-500">Pending Approvals</div>
            </div>
          </div>
        </div>
        
        {/* User Distribution Summary */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Distribution</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Role Distribution */}
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-3">By Role</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Students</span>
                    <span className="text-sm font-medium text-gray-700">{stats.studentPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${stats.studentPercentage}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Teachers</span>
                    <span className="text-sm font-medium text-gray-700">{stats.teacherPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${stats.teacherPercentage}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Admins</span>
                    <span className="text-sm font-medium text-gray-700">{stats.adminPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${stats.adminPercentage}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Status Distribution */}
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-3">By Status</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.approvedCount}</div>
                  <div className="text-sm text-gray-500">Approved</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</div>
                  <div className="text-sm text-gray-500">Pending</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.rejectedCount}</div>
                  <div className="text-sm text-gray-500">Rejected</div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="text-md font-medium text-gray-700 mb-2">Total Users: {stats.totalUsers}</div>
                <div className="flex h-4 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-4" style={{ width: `${stats.approvedCount / stats.totalUsers * 100}%` }}></div>
                  <div className="bg-yellow-500 h-4" style={{ width: `${stats.pendingCount / stats.totalUsers * 100}%` }}></div>
                  <div className="bg-red-500 h-4" style={{ width: `${stats.rejectedCount / stats.totalUsers * 100}%` }}></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>Approved: {Math.round(stats.approvedCount / stats.totalUsers * 100) || 0}%</span>
                  <span>Pending: {Math.round(stats.pendingCount / stats.totalUsers * 100) || 0}%</span>
                  <span>Rejected: {Math.round(stats.rejectedCount / stats.totalUsers * 100) || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Users Section */}
        <div className="bg-white shadow rounded-lg mb-8 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Approvals</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleStatusUpdate(user.id, 'approved')}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(user.id, 'rejected')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Users Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Users</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          user.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
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
  );
} 
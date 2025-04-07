'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import DashboardHeader from '@/components/DashboardHeader';

interface Student {
  id: number;
  name: string;
  email: string;
  status: string;
  enrolledAt: string;
  _count?: {
    submissions: number;
  };
}

export default function TeacherClassStudents() {
  const params = useParams();
  const classId = params.id as string;
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    averageSubmissions: 0
  });
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [showBulkActionMenu, setShowBulkActionMenu] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'single' | 'bulk';
    action: 'activate' | 'deactivate';
    studentIds: number[];
  } | null>(null);

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
      // Get all enrollments without status filter
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classes/${classId}/enrollments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Get all assignments for this class
      const assignmentsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classes/${classId}/assignments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // For each student, get their submissions
      const studentData = await Promise.all(response.data.map(async (enrollment: any) => {
        try {
          const submissionsResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/classes/assignments/${classId}/submissions?studentId=${enrollment.student.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          return {
            id: enrollment.id,
            name: enrollment.student.name,
            email: enrollment.student.email,
            status: enrollment.status,
            enrolledAt: enrollment.enrolledAt,
            _count: {
              submissions: submissionsResponse.data.length || 0
            }
          };
        } catch (error) {
          console.error(`Error fetching submissions for student ${enrollment.student.id}:`, error);
          return {
            id: enrollment.id,
            name: enrollment.student.name,
            email: enrollment.student.email,
            status: enrollment.status,
            enrolledAt: enrollment.enrolledAt,
            _count: {
              submissions: 0
            }
          };
        }
      }));
      
      setStudents(studentData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
      setLoading(false);
    }
  };

  const handleStatusChange = async (studentId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classes/enrollments/${studentId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Student status updated successfully');
      fetchStudents(token!, classId);
    } catch (error) {
      console.error('Error updating student status:', error);
      toast.error('Failed to update student status');
    }
  };

  const handleBulkStatusChange = async (newStatus: 'approved' | 'rejected') => {
    if (selectedStudents.length === 0) {
      toast.error('Please select students first');
      return;
    }

    setPendingAction({
      type: 'bulk',
      action: newStatus === 'approved' ? 'activate' : 'deactivate',
      studentIds: selectedStudents
    });
    setIsConfirmDialogOpen(true);
  };

  const executeStatusChange = async () => {
    if (!pendingAction) return;

    try {
      const token = localStorage.getItem('token');
      const { studentIds, action } = pendingAction;
      const newStatus = action === 'activate' ? 'approved' : 'rejected';

      await Promise.all(
        studentIds.map(id =>
          axios.put(
            `${process.env.NEXT_PUBLIC_API_URL}/api/classes/enrollments/${id}/status`,
            { status: newStatus },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );

      toast.success(
        `Successfully ${action}d ${studentIds.length} student${studentIds.length > 1 ? 's' : ''}`
      );
      setSelectedStudents([]);
      fetchStudents(token!, classId);
    } catch (error) {
      console.error('Error updating student status:', error);
      toast.error('Failed to update student status');
    } finally {
      setIsConfirmDialogOpen(false);
      setPendingAction(null);
      setShowBulkActionMenu(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(student => student.id));
    }
  };

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
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

  // Calculate stats
  useEffect(() => {
    if (!students.length) return;

    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.status === 'approved').length;
    const inactiveStudents = students.filter(s => s.status === 'rejected').length;
    
    // Calculate total submissions from active students
    const activeStudentSubmissions = students
      .filter(s => s.status === 'approved')
      .reduce((acc, student) => acc + (student._count?.submissions || 0), 0);
    
    // Calculate average submissions per student
    const averageSubmissions = activeStudents > 0 
      ? (activeStudentSubmissions / activeStudents)
      : 0;

    setStats({
      totalStudents,
      activeStudents,
      inactiveStudents,
      averageSubmissions: Number(averageSubmissions.toFixed(1)) // Round to 1 decimal place
    });
  }, [students]);

  // Filter and sort students
  const filteredStudents = students
    .filter(student => {
      const matchesSearch = 
        (student.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (student.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || student.status === selectedStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'email') {
        return a.email.localeCompare(b.email);
      } else if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      } else if (sortBy === 'submissions') {
        return (b._count?.submissions || 0) - (a._count?.submissions || 0);
      }
      return 0;
    });

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Students</h1>
          <Link
            href={`/teacher/classes/${classId}`}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Class
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalStudents}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-green-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-red-600">Inactive Students</p>
                <h3 className="text-2xl font-bold text-red-700">{stats.inactiveStudents}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-purple-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600">Avg. Submissions</p>
                <h3 className="text-2xl font-bold text-purple-700">
                  {stats.averageSubmissions}
                  <span className="text-sm font-normal text-purple-600 ml-1">per student</span>
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedStudents.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">
                  {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkStatusChange('approved')}
                    className="px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors duration-200"
                  >
                    Activate Selected
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('rejected')}
                    className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors duration-200"
                  >
                    Deactivate Selected
                  </button>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudents([])}
                className="text-gray-600 hover:text-gray-800"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Students</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="w-5 h-5 text-gray-400 absolute right-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="approved">Active</option>
                <option value="rejected">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Name A-Z</option>
                <option value="email">Email A-Z</option>
                <option value="status">Status</option>
                <option value="submissions">Most Submissions</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
                <p className="mt-2 text-gray-500">Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-500">
                  {searchTerm || selectedStatus !== 'all' 
                    ? "Try adjusting your search or filters"
                    : "No students are enrolled in this class yet"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedStudents.length === filteredStudents.length}
                            onChange={toggleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          Student
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submissions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enrolled On
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <tr 
                        key={student.id} 
                        className={`hover:bg-gray-50 ${
                          selectedStudents.includes(student.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => toggleStudentSelection(student.id)}
                              className="mr-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {student.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{student.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${student.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                            ${student.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                            ${student.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                          `}>
                            {student.status === 'approved' ? 'Active' : 
                             student.status === 'rejected' ? 'Inactive' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student._count?.submissions || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(student.enrolledAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleStatusChange(student.id, student.status === 'approved' ? 'rejected' : 'approved')}
                            className={`px-3 py-1 rounded-md transition-colors
                              ${student.status === 'approved' 
                                ? 'text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100'
                                : 'text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100'
                              }`}
                          >
                            {student.status === 'approved' ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Dialog */}
        {isConfirmDialogOpen && pendingAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Action</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to {pendingAction.action} 
                {pendingAction.type === 'bulk' ? ` ${pendingAction.studentIds.length} selected` : ' this'} student
                {pendingAction.studentIds.length > 1 ? 's' : ''}?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsConfirmDialogOpen(false);
                    setPendingAction(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeStatusChange}
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${
                    pendingAction.action === 'activate'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
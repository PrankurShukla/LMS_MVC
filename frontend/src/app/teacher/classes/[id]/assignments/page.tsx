'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import DashboardHeader from '@/components/DashboardHeader';

interface Assignment {
  id: number;
  classId: number;
  title: string;
  description: string;
  dueDate: string;
  createdAt: string;
  _count?: {
    submissions: number;
  };
  totalStudents?: number;
  status: 'upcoming' | 'ongoing' | 'past';
}

interface ClassDetails {
  id: number;
  name: string;
  description?: string;
}

const AssignmentCard = ({ 
  assignment, 
  onDelete 
}: { 
  assignment: Assignment; 
  onDelete: (id: number) => void;
}) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    await onDelete(assignment.id);
    setIsDeleting(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'past':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 transition-all duration-200 ${
        isHovered ? 'transform translate-y-[-2px] shadow-md' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => router.push(`/teacher/classes/${assignment.classId}/assignments/${assignment.id}/submissions`)}
      role="button"
      tabIndex={0}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assignment.status)}`}>
              {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
            </span>
            <span className="text-sm text-gray-600">
              {assignment._count?.submissions || 0}/{assignment.totalStudents || 0} submitted
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{assignment.title}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{assignment.description}</p>
          <div className="flex items-center text-sm text-gray-500">
            <span>Due: {new Date(assignment.dueDate).toLocaleString()}</span>
          </div>
        </div>
        
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`ml-4 p-2 rounded-full hover:bg-red-50 text-red-600 transition-colors ${
            isDeleting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          aria-label="Delete assignment"
        >
          {isDeleting ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default function TeacherClassAssignments() {
  const params = useParams();
  const classId = params.id as string;
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: ''
  });

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
      fetchAssignments(token, classId);
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

  const fetchAssignments = async (token: string, classId: string) => {
    try {
      setLoading(true);
      // First get the total number of active students
      const studentsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classes/${classId}/enrollments?status=approved`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const totalActiveStudents = studentsResponse.data.length;
      
      // Get assignments with their submissions
      const assignmentsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classes/${classId}/assignments`,
        { 
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Fetch submissions count for each assignment and calculate status
      const assignmentsWithTotals = await Promise.all(assignmentsResponse.data.map(async (assignment: any) => {
        // Get submissions for this specific assignment
        const submissionsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/classes/assignments/${assignment.id}/submissions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Calculate assignment status
        const now = new Date();
        const dueDate = new Date(assignment.dueDate);
        let status: 'upcoming' | 'ongoing' | 'past';

        if (dueDate < now) {
          status = 'past';
        } else if (dueDate.getTime() - now.getTime() <= 24 * 60 * 60 * 1000) { // Within 24 hours
          status = 'ongoing';
        } else {
          status = 'upcoming';
        }
        
        return {
          ...assignment,
          totalStudents: totalActiveStudents,
          _count: {
            submissions: submissionsResponse.data.length || 0
          },
          status
        };
      }));
      
      setAssignments(assignmentsWithTotals);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to fetch assignments');
      setLoading(false);
    }
  };

  // Add a refresh interval to keep counts updated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && classId) {
      // Initial fetch
      fetchAssignments(token, classId);

      // Set up refresh interval
      const intervalId = setInterval(() => {
        fetchAssignments(token, classId);
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(intervalId);
    }
  }, [classId]);

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAssignment.title || !newAssignment.description || !newAssignment.dueDate) {
      toast.error('Title, description, and due date are required');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classes/assignments`,
        { 
          classId: Number(classId),
          title: newAssignment.title,
          description: newAssignment.description,
          dueDate: newAssignment.dueDate
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Assignment added successfully');
      setShowAddModal(false);
      setNewAssignment({
        title: '',
        description: '',
        dueDate: ''
      });
      
      // Refresh assignments
      fetchAssignments(token as string, classId);
    } catch (error) {
      console.error('Error adding assignment:', error);
      toast.error('Failed to add assignment');
    }
  };

  const deleteAssignment = async (assignmentId: number) => {
    if (!confirm('Are you sure you want to delete this assignment?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Assignment deleted successfully');
      
      // Refresh assignments
      fetchAssignments(token as string, classId);
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
    }
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isPastDue = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  // Process assignments with status
  const processedAssignments = assignments.map(assignment => {
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    let status: 'upcoming' | 'ongoing' | 'past';

    if (dueDate > new Date(now.getTime() + 24 * 60 * 60 * 1000)) {
      status = 'upcoming';
    } else if (dueDate < now) {
      status = 'past';
    } else {
      status = 'ongoing';
    }

    return { ...assignment, status };
  });

  // Filter and sort assignments
  const filteredAssignments = processedAssignments
    .filter(assignment => {
      const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || assignment.status === selectedStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'submissions') {
        return (b._count?.submissions || 0) - (a._count?.submissions || 0);
      }
      return 0;
    });

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

  // Get tomorrow's date in YYYY-MM-DD format for the min date on the datepicker
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Assignments</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add Assignment
            </button>
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
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Assignments</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title or description..."
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
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="past">Past</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="dueDate">Due Date</option>
                <option value="title">Title A-Z</option>
                <option value="submissions">Most Submissions</option>
              </select>
            </div>
          </div>
        </div>

        {/* Assignments Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            {loading ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                      <div className="h-6 w-32 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new assignment.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg
                      className="-ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Add Assignment
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {assignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onDelete={deleteAssignment}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Assignment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add New Assignment</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="title">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="dueDate">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  id="dueDate"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Add Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
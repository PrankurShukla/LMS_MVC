'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import DashboardHeader from '@/components/DashboardHeader';

interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

interface ClassDetails {
  id: number;
  name: string;
  description?: string;
}

export default function TeacherClassAssignments() {
  const params = useParams();
  const classId = params.id as string;
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDescription, setAssignmentDescription] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');

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
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/${classId}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to fetch assignments');
      setLoading(false);
    }
  };

  const addAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assignmentTitle || !assignmentDescription || !assignmentDueDate) {
      toast.error('Title, description, and due date are required');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classes/assignments`,
        { 
          classId: Number(classId),
          title: assignmentTitle,
          description: assignmentDescription,
          dueDate: assignmentDueDate
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Assignment added successfully');
      setShowAddModal(false);
      setAssignmentTitle('');
      setAssignmentDescription('');
      setAssignmentDueDate('');
      
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
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <DashboardHeader title={`${classDetails?.name} - Assignments`} userName={currentUser?.name} />
          <div className="flex space-x-4">
            <Link 
              href={`/teacher/classes/${classId}`} 
              className="text-blue-500 hover:text-blue-700"
            >
              Back to Class
            </Link>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Add Assignment
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            {loading ? (
              <div className="text-center py-6">Loading assignments...</div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-4">No assignments have been added to this class yet.</p>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                >
                  Create First Assignment
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="border rounded-lg overflow-hidden">
                    <div className={`p-4 flex justify-between items-center ${
                      isPastDue(assignment.dueDate) ? 'bg-red-50' : 'bg-gray-50'
                    }`}>
                      <div>
                        <h3 className="text-lg font-bold">{assignment.title}</h3>
                        <div className={`text-sm ${
                          isPastDue(assignment.dueDate) ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          Due: {formatDueDate(assignment.dueDate)}
                          {isPastDue(assignment.dueDate) && ' (Past due)'}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Link 
                          href={`/teacher/classes/${classId}/assignments/${assignment.id}/submissions`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Submissions
                        </Link>
                        <button 
                          onClick={() => deleteAssignment(assignment.id)}
                          className="text-red-600 hover:text-red-800 ml-4"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="prose max-w-none whitespace-pre-line">
                        {assignment.description}
                      </div>
                      <div className="mt-4 text-sm text-gray-500">
                        Created on {new Date(assignment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Assignment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Add Assignment</h2>
            <form onSubmit={addAssignment}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
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
                  value={assignmentDescription}
                  onChange={(e) => setAssignmentDescription(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows={6}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dueDate">
                  Due Date
                </label>
                <input
                  id="dueDate"
                  type="datetime-local"
                  value={assignmentDueDate}
                  onChange={(e) => setAssignmentDueDate(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min={minDate}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Set a due date in the future</p>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
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
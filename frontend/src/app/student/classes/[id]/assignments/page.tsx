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
  submission?: {
    id: number;
    content: string;
    grade?: number;
    feedback?: string;
    submittedAt: string;
    gradedAt?: string;
  };
}

interface ClassDetails {
  id: number;
  name: string;
  description?: string;
  teacher: {
    name: string;
  };
}

export default function StudentClassAssignments() {
  const params = useParams();
  const classId = params.id as string;
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');

  useEffect(() => {
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
      fetchClassDetails(token, classId);
      checkEnrollmentStatus(token, classId);
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

  const checkEnrollmentStatus = async (token: string, classId: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/student/my-enrollments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const enrollment = response.data.find((e: any) => 
        e.class.id === parseInt(classId) && e.status === 'approved'
      );
      
      setIsEnrolled(!!enrollment);
      
      if (enrollment) {
        fetchAssignments(token, classId);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking enrollment status:', error);
      setLoading(false);
    }
  };

  const fetchAssignments = async (token: string, classId: string) => {
    try {
      setLoading(true);
      // Fetch assignments for this class
      const assignmentsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/${classId}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const assignmentsData = assignmentsResponse.data;
      
      // Fetch my submissions for these assignments
      const submissionsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/student/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Map submissions to their corresponding assignments
      const submissionsMap = new Map();
      submissionsResponse.data.forEach((sub: any) => {
        submissionsMap.set(sub.assignmentId, sub);
      });
      
      // Merge assignment data with submission data
      const assignmentsWithSubmissions = assignmentsData.map((assignment: any) => {
        return {
          ...assignment,
          submission: submissionsMap.get(assignment.id) || null
        };
      });
      
      setAssignments(assignmentsWithSubmissions);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to fetch assignments');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAssignment || !submissionContent.trim()) {
      toast.error('Please enter your submission content');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classes/assignments/submit`,
        { 
          assignmentId: selectedAssignment.id,
          content: submissionContent
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Assignment submitted successfully');
      setShowSubmitModal(false);
      setSelectedAssignment(null);
      setSubmissionContent('');
      
      // Refresh assignments to show the new submission
      fetchAssignments(token as string, classId);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('Failed to submit assignment');
    }
  };

  const openSubmitModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionContent(assignment.submission?.content || '');
    setShowSubmitModal(true);
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isPastDue = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const getSubmissionStatus = (assignment: Assignment) => {
    if (!assignment.submission) {
      return isPastDue(assignment.dueDate) 
        ? { status: 'missed', text: 'Missed', color: 'bg-red-100 text-red-800' }
        : { status: 'pending', text: 'Not Submitted', color: 'bg-yellow-100 text-yellow-800' };
    }
    
    if (assignment.submission.grade !== null && assignment.submission.grade !== undefined) {
      return { status: 'graded', text: `Graded: ${assignment.submission.grade}/100`, color: 'bg-green-100 text-green-800' };
    }
    
    return { status: 'submitted', text: 'Submitted', color: 'bg-blue-100 text-blue-800' };
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

  // If student is not enrolled, show access denied
  if (!isEnrolled) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <DashboardHeader title={classDetails?.name || 'Class'} userName={currentUser?.name} />
          <div className="mt-8 text-center">
            <p className="text-red-500">You are not enrolled in this class.</p>
            <Link href="/student/dashboard" className="mt-4 inline-block text-blue-500 hover:text-blue-700">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <DashboardHeader title={`${classDetails?.name} - Assignments`} userName={currentUser?.name} />
          <Link 
            href={`/student/classes/${classId}`} 
            className="text-blue-500 hover:text-blue-700"
          >
            Back to Class
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            {loading ? (
              <div className="text-center py-6">Loading assignments...</div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">No assignments have been posted for this class yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {assignments.map((assignment) => {
                  const submissionStatus = getSubmissionStatus(assignment);
                  return (
                    <div key={assignment.id} className="border rounded-lg overflow-hidden">
                      <div className={`p-4 flex justify-between items-center ${
                        isPastDue(assignment.dueDate) && submissionStatus.status === 'pending' 
                          ? 'bg-red-50' 
                          : 'bg-gray-50'
                      }`}>
                        <div>
                          <h3 className="text-lg font-bold">{assignment.title}</h3>
                          <div className="text-sm text-gray-500">
                            Due: {formatDueDate(assignment.dueDate)}
                            {isPastDue(assignment.dueDate) && submissionStatus.status === 'pending' && ' (Past due)'}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${submissionStatus.color}`}>
                            {submissionStatus.text}
                          </span>
                          {submissionStatus.status !== 'missed' && (
                            <button 
                              onClick={() => openSubmitModal(assignment)}
                              className="ml-4 bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold py-1 px-3 rounded"
                              disabled={submissionStatus.status === 'graded'}
                            >
                              {submissionStatus.status === 'pending' ? 'Submit' : 'View/Edit'}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="prose max-w-none whitespace-pre-line">
                          {assignment.description}
                        </div>
                        
                        {assignment.submission && assignment.submission.feedback && (
                          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                            <h4 className="font-bold text-blue-800">Teacher Feedback:</h4>
                            <p className="text-blue-800">{assignment.submission.feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Assignment Modal */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {selectedAssignment.submission ? 'Edit Submission' : 'Submit Assignment'}
            </h2>
            <h3 className="text-lg mb-4">{selectedAssignment.title}</h3>
            
            {selectedAssignment.submission?.grade !== undefined && selectedAssignment.submission?.grade !== null ? (
              <div className="mb-4 p-3 bg-green-50 rounded border border-green-200">
                <p className="font-bold text-green-800">
                  This assignment has been graded. Your grade is: {selectedAssignment.submission.grade}/100
                </p>
                {selectedAssignment.submission.feedback && (
                  <div className="mt-2">
                    <h4 className="font-bold text-green-800">Feedback:</h4>
                    <p className="text-green-800">{selectedAssignment.submission.feedback}</p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="content">
                    Your Answer
                  </label>
                  <textarea
                    id="content"
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    rows={8}
                    required
                    placeholder="Enter your answer here..."
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    {selectedAssignment.submission ? 'Update Submission' : 'Submit Assignment'}
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
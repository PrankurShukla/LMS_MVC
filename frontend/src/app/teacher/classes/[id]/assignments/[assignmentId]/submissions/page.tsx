'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import DashboardHeader from '@/components/DashboardHeader';

interface Submission {
  id: number;
  content: string;
  grade?: number;
  feedback?: string;
  submittedAt: string;
  student: {
    id: number;
    name: string;
    email: string;
  };
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  class: {
    id: number;
    name: string;
  };
}

export default function AssignmentSubmissions() {
  const params = useParams();
  const classId = params.id as string;
  const assignmentId = params.assignmentId as string;
  const router = useRouter();
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [grade, setGrade] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');

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
      fetchAssignment(token);
      fetchSubmissions(token);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, [assignmentId]);

  const fetchAssignment = async (token: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignment(response.data);
    } catch (error) {
      console.error('Error fetching assignment details:', error);
      toast.error('Failed to fetch assignment details');
    }
  };

  const fetchSubmissions = async (token: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/assignments/${assignmentId}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubmissions(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to fetch submissions');
      setLoading(false);
    }
  };

  const openGradeModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade?.toString() || '');
    setFeedback(submission.feedback || '');
    setShowGradeModal(true);
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSubmission) return;
    
    // Validate grade is between 0 and 100
    const gradeNum = parseInt(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      toast.error('Grade must be a number between 0 and 100');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classes/submissions/${selectedSubmission.id}/grade`,
        { 
          grade: gradeNum,
          feedback
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Submission graded successfully');
      setShowGradeModal(false);
      
      // Refresh submissions list
      fetchSubmissions(token as string);
    } catch (error) {
      console.error('Error grading submission:', error);
      toast.error('Failed to grade submission');
    }
  };

  if (loading && !assignment) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <DashboardHeader title="Loading..." userName={currentUser?.name} />
          <div className="mt-8 text-center">Loading submissions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <DashboardHeader 
            title={`${assignment?.title || 'Assignment'} - Submissions`} 
            userName={currentUser?.name} 
          />
          <Link 
            href={`/teacher/classes/${classId}/assignments`} 
            className="text-blue-500 hover:text-blue-700"
          >
            Back to Assignments
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-2">{assignment?.title}</h2>
            <p className="text-gray-500 mb-4">
              {assignment?.class?.name} • 
              Due: {new Date(assignment?.dueDate || '').toLocaleDateString()} at {new Date(assignment?.dueDate || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="prose max-w-none mb-6">
              <p>{assignment?.description}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-bold">Student Submissions</h2>
            <p className="text-sm text-gray-500">
              {submissions.length} submission{submissions.length !== 1 ? 's' : ''} received
            </p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-6">Loading submissions...</div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">No submissions have been received for this assignment yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {submissions.map((submission) => (
                      <tr key={submission.id}>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{submission.student.name}</div>
                          <div className="text-sm text-gray-500">{submission.student.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(submission.submittedAt).toLocaleDateString()} at {new Date(submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {submission.grade !== undefined && submission.grade !== null ? (
                            <span className="px-2 py-1 text-sm rounded-full bg-green-100 text-green-800">
                              {submission.grade}/100
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800">
                              Not Graded
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => openGradeModal(submission)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {submission.grade !== undefined && submission.grade !== null ? 'Update Grade' : 'Grade'}
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
      </div>

      {/* Grade Modal */}
      {showGradeModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl">
            <h2 className="text-xl font-bold mb-4">{selectedSubmission.grade !== undefined ? 'Update Grade' : 'Grade Submission'}</h2>
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Student: {selectedSubmission.student.name}</h3>
              <p className="text-gray-500 mb-2">Submitted on {new Date(selectedSubmission.submittedAt).toLocaleDateString()}</p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">Submission:</h4>
                <div className="whitespace-pre-line text-gray-800">
                  {selectedSubmission.content}
                </div>
              </div>
            </div>
            
            <form onSubmit={handleGradeSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="grade">
                  Grade (0-100)
                </label>
                <input
                  id="grade"
                  type="number"
                  min="0"
                  max="100"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="feedback">
                  Feedback (Optional)
                </label>
                <textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows={4}
                  placeholder="Provide feedback to the student..."
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowGradeModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  Save Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
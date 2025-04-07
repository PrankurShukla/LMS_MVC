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

const SubmissionCard = ({ 
  submission, 
  onGrade 
}: { 
  submission: Submission; 
  onGrade: (submission: Submission) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 transition-all duration-200 ${
        isHovered ? 'transform translate-y-[-2px] shadow-md' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{submission.student.name}</h3>
            <span className="text-sm text-gray-500">{submission.student.email}</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 mb-3">
            <p className="text-gray-700 whitespace-pre-wrap">{submission.content}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Submitted: {new Date(submission.submittedAt).toLocaleString()}
            </span>
            {submission.grade !== undefined && (
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                  submission.grade >= 90 ? 'bg-green-100 text-green-800' :
                  submission.grade >= 80 ? 'bg-blue-100 text-blue-800' :
                  submission.grade >= 70 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  Grade: {submission.grade}/100
                </span>
                {submission.feedback && (
                  <span className="text-sm text-gray-500">
                    Feedback: {submission.feedback}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => onGrade(submission)}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {submission.grade !== undefined ? 'Update Grade' : 'Grade'}
        </button>
      </div>
    </div>
  );
};

const GradeModal = ({
  submission,
  isOpen,
  onClose,
  onSubmit,
  grade,
  setGrade,
  feedback,
  setFeedback
}: {
  submission: Submission | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  grade: string;
  setGrade: (grade: string) => void;
  feedback: string;
  setFeedback: (feedback: string) => void;
}) => {
  if (!isOpen || !submission) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <h3 className="text-lg font-semibold mb-4">
          Grade Submission - {submission.student.name}
        </h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade (0-100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feedback (optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Provide feedback to the student..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Grade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{assignment?.title || 'Assignment'}</h1>
            <p className="text-gray-500">
              {assignment?.class?.name} • Due: {new Date(assignment?.dueDate || '').toLocaleString()}
            </p>
          </div>
          <Link
            href={`/teacher/classes/${classId}/assignments`}
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
            Back to Assignments
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Assignment Details</h2>
            <p className="text-gray-700">{assignment?.description}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Student Submissions</h2>
              <p className="text-gray-500">
                {submissions.length} submission{submissions.length !== 1 ? 's' : ''} received
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-5 w-40 bg-gray-200 rounded"></div>
                    <div className="h-4 w-60 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-24 bg-gray-100 rounded mb-4"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    <div className="h-8 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Waiting for students to submit their work.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  onGrade={openGradeModal}
                />
              ))}
            </div>
          )}
        </div>

        <GradeModal
          submission={selectedSubmission}
          isOpen={showGradeModal}
          onClose={() => setShowGradeModal(false)}
          onSubmit={handleGradeSubmit}
          grade={grade}
          setGrade={setGrade}
          feedback={feedback}
          setFeedback={setFeedback}
        />
      </div>
    </div>
  );
} 
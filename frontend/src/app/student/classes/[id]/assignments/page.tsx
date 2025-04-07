'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

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

const formatDueDate = (dateString: string) => {
  return format(new Date(dateString), "MMMM d, yyyy 'at' h:mm a");
};

const getSubmissionStatus = (assignment: Assignment) => {
  if (assignment.submission?.grade !== undefined && assignment.submission?.grade !== null) {
    return {
      text: 'Graded',
      color: 'bg-green-100 text-green-800',
      icon: (
        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };
  }
  if (assignment.submission) {
    return {
      text: 'Submitted',
      color: 'bg-blue-100 text-blue-800',
      icon: (
        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    };
  }
  if (new Date(assignment.dueDate) < new Date()) {
    return {
      text: 'Missed',
      color: 'bg-red-100 text-red-800',
      icon: (
        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };
  }
  return {
    text: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: (
      <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };
};

const AssignmentCard = ({ assignment, onSubmit }: { assignment: Assignment; onSubmit: () => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const submissionStatus = getSubmissionStatus(assignment);
  const isPastDue = new Date(assignment.dueDate) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-200"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{assignment.title}</h3>
            <div className="flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Due: {formatDueDate(assignment.dueDate)}
              {isPastDue && submissionStatus.text === 'Pending' && (
                <span className="ml-2 text-red-500 font-medium">(Past due)</span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${submissionStatus.color}`}>
              {submissionStatus.icon}
              {submissionStatus.text}
            </div>
            {submissionStatus.text !== 'Missed' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSubmit}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  submissionStatus.text === 'Graded'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                disabled={submissionStatus.text === 'Graded'}
              >
                {submissionStatus.text === 'Pending' ? 'Submit' : 'View/Edit'}
              </motion.button>
            )}
          </div>
        </div>

        <motion.div
          initial={false}
          animate={{ height: isExpanded ? 'auto' : '80px' }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className={`prose prose-sm max-w-none ${!isExpanded ? 'line-clamp-3' : ''}`}>
            {assignment.description}
          </div>
          {!isExpanded && assignment.description.length > 240 && (
            <div className="mt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsExpanded(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                Read more
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.button>
            </div>
          )}
        </motion.div>

        {assignment.submission?.feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100"
          >
            <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Teacher Feedback
            </h4>
            <p className="text-sm text-blue-800">{assignment.submission.feedback}</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

const SubmitModal = ({
  isOpen,
  onClose,
  assignment,
  submissionContent,
  setSubmissionContent,
  onSubmit,
  isSubmitting
}: {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  submissionContent: string;
  setSubmissionContent: (content: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden"
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {assignment.submission ? 'Edit Submission' : 'Submit Assignment'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{assignment.title}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            {assignment.submission?.grade !== undefined && assignment.submission?.grade !== null ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200"
              >
                <div className="flex items-center mb-3">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-green-900">
                    Assignment Graded: {assignment.submission.grade}/100
                  </h3>
                </div>
                {assignment.submission.feedback && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-green-900 mb-1">Feedback:</h4>
                    <p className="text-sm text-green-800">{assignment.submission.feedback}</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Answer
                  </label>
                  <textarea
                    id="content"
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm"
                    rows={8}
                    required
                    placeholder="Enter your answer here..."
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting || !submissionContent.trim()}
                    className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center ${
                      isSubmitting || !submissionContent.trim() ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Submitting...
                      </>
                    ) : assignment.submission ? (
                      'Update Submission'
                    ) : (
                      'Submit Assignment'
                    )}
                  </motion.button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const LoadingState = () => (
  <div className="space-y-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
          <div className="flex space-x-3">
            <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
            <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
          <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = () => (
  <div className="bg-white rounded-xl shadow-sm p-12 text-center">
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
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
    <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments yet</h3>
    <p className="mt-1 text-sm text-gray-500">No assignments have been posted for this class yet.</p>
  </div>
);

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
  const [error, setError] = useState(false);

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

  if (loading && !classDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded mt-2 animate-pulse"></div>
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <LoadingState />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{classDetails?.name || 'Class'}</h1>
              <p className="text-gray-500 mt-1">Assignments</p>
            </div>
            <Link
              href="/student/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg className="mr-2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Access Denied</h3>
            <p className="mt-1 text-gray-500">You are not enrolled in this class.</p>
            <div className="mt-6">
              <Link
                href="/student/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{classDetails?.name}</h1>
            <p className="text-gray-500 mt-1">Assignments</p>
          </div>
          <Link
            href={`/student/classes/${classId}`}
            className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <svg className="mr-2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Class
          </Link>
        </div>

        <div className="space-y-6">
          {loading ? (
            <LoadingState />
          ) : assignments.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-6">
              {assignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onSubmit={() => {
                    setSelectedAssignment(assignment);
                    setSubmissionContent(assignment.submission?.content || '');
                    setShowSubmitModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <AnimatePresence>
          {showSubmitModal && selectedAssignment && (
            <SubmitModal
              isOpen={showSubmitModal}
              onClose={() => setShowSubmitModal(false)}
              assignment={selectedAssignment}
              submissionContent={submissionContent}
              setSubmissionContent={setSubmissionContent}
              onSubmit={handleSubmit}
              isSubmitting={loading}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 
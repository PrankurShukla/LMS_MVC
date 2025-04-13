'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { getApiUrl } from '@/lib/apiUrl';

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
  console.log(`Getting status for assignment ${assignment.id}:`, assignment);
  console.log(`Submission details for ${assignment.id}:`, assignment.submission);
  
  if (assignment.submission && typeof assignment.submission.grade === 'number') {
    console.log(`Assignment ${assignment.id} is GRADED with ${assignment.submission.grade}/100`);
    return {
      text: `Graded: ${assignment.submission.grade}/100`,
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
  console.log(`Rendering AssignmentCard for assignment ${assignment.id}`);
  console.log(`Submission for assignment ${assignment.id}:`, assignment.submission);
  
  const submissionStatus = getSubmissionStatus(assignment);
  const isPastDue = new Date(assignment.dueDate) < new Date();
  
  const isGraded = assignment.submission && typeof assignment.submission.grade === 'number';
  console.log(`Assignment ${assignment.id} isGraded:`, isGraded);

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
            
            {isGraded && assignment.submission && (
              <div className="mt-2 flex items-center">
                <span className="font-medium text-green-700 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Grade: {assignment.submission.grade}/100
                </span>
              </div>
            )}
            
            {isGraded && assignment.submission?.feedback && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Feedback: </span>
                  {assignment.submission?.feedback}
                </p>
              </div>
            )}
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
                  isGraded
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isGraded ? 'View Submission' : (submissionStatus.text === 'Submitted' ? 'View/Edit' : 'Submit')}
              </motion.button>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm text-gray-800 whitespace-pre-wrap">{isExpanded ? assignment.description : `${assignment.description.slice(0, 300)}${assignment.description.length > 300 ? '...' : ''}`}</div>
          {assignment.description.length > 300 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
              {isExpanded ? 'Read less' : 'Read more'}
            </button>
          )}
        </div>
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
  const isGraded = assignment.submission && typeof assignment.submission.grade === 'number';
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-lg w-full max-w-4xl p-6 relative max-h-[90vh] overflow-auto"
        >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">{assignment.title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
          </button>
        </div>

        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
            </div>

        {isGraded && assignment.submission ? (
          <div>
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center mb-3">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-green-900">
                    Assignment Graded: {assignment.submission.grade}/100
                  </h3>
                </div>
              {assignment.submission?.feedback && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-green-900 mb-1">Feedback:</h4>
                  <p className="text-sm text-green-800">{assignment.submission?.feedback}</p>
                  </div>
                )}
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your Submission:</h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap">{submissionContent}</p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Submission:
                  </label>
                  <textarea
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type your answer here..."
                    required
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
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Submitting...
                      </>
                    ) : (
                  'Submit'
                    )}
              </button>
                </div>
              </form>
            )}
      </motion.div>
    </div>
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
  }, [classId, showSubmitModal]);

  const fetchClassDetails = async (token: string, classId: string) => {
    try {
      const response = await axios.get(`${getApiUrl()}/api/classes/${classId}`, {
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
      const response = await axios.get(`${getApiUrl()}/api/classes/student/my-enrollments`, {
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
      console.log("Fetching assignments for class ID:", classId);
      
      // Fetch assignments for this class
      const assignmentsResponse = await axios.get(`${getApiUrl()}/api/classes/${classId}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("Assignments response:", assignmentsResponse.data);
      const assignmentsData = assignmentsResponse.data;
      
      // Fetch my submissions directly for these assignments
      const submissionsPromises = assignmentsData.map((assignment: any) => 
        axios.get(`${getApiUrl()}/api/classes/assignments/${assignment.id}/my-submission`, {
        headers: { Authorization: `Bearer ${token}` },
        }).catch(error => {
          console.log(`No submission found for assignment ${assignment.id}`);
          return { data: null };
        })
      );
      
      const submissionsResponses = await Promise.all(submissionsPromises);
      console.log("Individual submissions responses:", submissionsResponses);
      
      // Create a map to easily look up submissions by assignment ID
      const submissionsMap = new Map();
      
      submissionsResponses.forEach((response, index) => {
        if (response.data && response.data.id) {
          const submission = response.data;
          const assignmentId = assignmentsData[index].id;
          console.log(`Found submission for assignment ${assignmentId}:`, submission);
          console.log(`Submission grade:`, submission.grade);
          console.log(`Grade type: ${typeof submission.grade}, Value: ${submission.grade}`);
          submissionsMap.set(assignmentId, submission);
        }
      });
      
      console.log("Final submissions map:", Array.from(submissionsMap.entries()));
      
      // Merge assignment data with submission data
      const assignmentsWithSubmissions = assignmentsData.map((assignment: any) => {
        const submission = submissionsMap.get(assignment.id);
        console.log(`Assignment ${assignment.id} submission:`, submission);
        
        return {
          ...assignment,
          submission: submission || null
        };
      });
      
      console.log("Final assignments with submissions:", assignmentsWithSubmissions);
      
      setAssignments(assignmentsWithSubmissions);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to fetch assignments');
      setError(true);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAssignment || !submissionContent.trim()) {
      toast.error('Please enter your submission content');
      return;
    }
    
    if (selectedAssignment.submission && typeof selectedAssignment.submission.grade === 'number') {
      toast.error('This assignment has already been graded and cannot be resubmitted');
      setShowSubmitModal(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${getApiUrl()}/api/classes/assignments/submit`,
        { 
          assignmentId: selectedAssignment.id,
          content: submissionContent
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Assignment submitted successfully');
      setShowSubmitModal(false);
      
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
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface Class {
  id: number;
  name: string;
  description: string;
  teacher: {
    id: number;
    name: string;
  };
}

interface Enrollment {
  id: number;
  status: string;
  class: Class;
}

const ClassCard = ({ 
  enrollment,
  onEnroll
}: { 
  enrollment: Enrollment;
  onEnroll?: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 ${
        isHovered ? 'transform translate-y-[-2px] shadow-md' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{enrollment.class.name}</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            enrollment.status === 'approved' ? 'bg-green-100 text-green-800' :
            enrollment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
          </span>
        </div>
        <p className="text-gray-600 mb-4 line-clamp-2">{enrollment.class.description}</p>
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {enrollment.class.teacher.name}
        </div>
        {enrollment.status === 'approved' && (
          <div className="grid grid-cols-3 gap-2">
            <Link 
              href={`/student/classes/${enrollment.class.id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors"
            >
              View Class
            </Link>
            <Link 
              href={`/student/classes/${enrollment.class.id}/materials`}
              className="bg-purple-600 hover:bg-purple-700 text-white text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors"
            >
              Materials
            </Link>
            <Link 
              href={`/student/classes/${enrollment.class.id}/assignments`}
              className="bg-green-600 hover:bg-green-700 text-white text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors"
            >
              Assignments
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

const EnrollModal = ({
  isOpen,
  onClose,
  availableClasses,
  selectedClassId,
  setSelectedClassId,
  onSubmit,
  isSubmitting
}: {
  isOpen: boolean;
  onClose: () => void;
  availableClasses: Class[];
  selectedClassId: number | null;
  setSelectedClassId: (id: number | null) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Enroll in a Class</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {availableClasses.length === 0 ? (
          <div className="text-center py-6">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-gray-500">No available classes to enroll in at the moment.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select a Class
              </label>
              <select
                value={selectedClassId || ''}
                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">-- Select a Class --</option>
                {availableClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} (by {cls.teacher.name})
                  </option>
                ))}
              </select>
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
                disabled={!selectedClassId || isSubmitting}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 ${
                  (!selectedClassId || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
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
                    Enrolling...
                  </>
                ) : (
                  'Request Enrollment'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default function StudentDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ name?: string, id?: number } | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  useEffect(() => {
    // Check if user is logged in and is a student
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
      fetchStudentEnrollments(token);
      fetchAvailableClasses(token);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, []);

  const fetchStudentEnrollments = async (token: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/student/my-enrollments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnrollments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to fetch your enrollments');
      setLoading(false);
    }
  };

  const fetchAvailableClasses = async (token: string) => {
    try {
      // Get all classes
      const allClassesResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Get my enrollments (including rejected ones)
      const myEnrollmentsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/student/my-enrollments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Extract list of enrolled class IDs with approved or pending status
      const enrolledOrPendingClassIds = myEnrollmentsResponse.data
        .filter((enrollment: Enrollment) => enrollment.status === 'approved' || enrollment.status === 'pending')
        .map((enrollment: Enrollment) => enrollment.class.id);
      
      // Filter out classes that the student is already enrolled in or has pending requests
      const availableClasses = allClassesResponse.data.filter((cls: Class) => {
        return !enrolledOrPendingClassIds.includes(cls.id);
      });
      
      setAvailableClasses(availableClasses);
    } catch (error) {
      console.error('Error fetching available classes:', error);
      toast.error('Failed to fetch available classes');
    }
  };

  const requestEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;
    
    try {
      const token = localStorage.getItem('token');
      setLoading(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classes/enroll`,
        { classId: selectedClassId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Show appropriate message based on the response
      if (response.data.message) {
        toast.success(response.data.message);
      } else {
        toast.success('Enrollment request sent successfully');
      }
      
      setShowEnrollModal(false);
      setSelectedClassId(null);
      
      // Refresh data
      fetchStudentEnrollments(token as string);
      fetchAvailableClasses(token as string);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      console.error('Error requesting enrollment:', error);
      
      // Display appropriate error message
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to request enrollment');
      }
    }
  };

  // Group enrollments by status
  const approvedEnrollments = enrollments.filter(e => e.status === 'approved');
  const pendingEnrollments = enrollments.filter(e => e.status === 'pending');
  const rejectedEnrollments = enrollments.filter(e => e.status === 'rejected');

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-gray-500">Welcome back, {currentUser?.name}</p>
          </div>
          <button
            onClick={() => setShowEnrollModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            disabled={availableClasses.length === 0}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Enroll in New Class
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Enrolled Classes</p>
                <p className="text-2xl font-bold text-gray-900">{approvedEnrollments.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Enrollments</p>
                <p className="text-2xl font-bold text-gray-900">{pendingEnrollments.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Available Classes</p>
                <p className="text-2xl font-bold text-gray-900">{availableClasses.length}</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-6 w-1/3 bg-gray-200 rounded"></div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {approvedEnrollments.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">My Classes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {approvedEnrollments.map((enrollment) => (
                    <ClassCard key={enrollment.id} enrollment={enrollment} />
                  ))}
                </div>
              </div>
            )}

            {pendingEnrollments.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Enrollments</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingEnrollments.map((enrollment) => (
                    <ClassCard key={enrollment.id} enrollment={enrollment} />
                  ))}
                </div>
              </div>
            )}

            {rejectedEnrollments.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Rejected Enrollments</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rejectedEnrollments.map((enrollment) => (
                    <ClassCard key={enrollment.id} enrollment={enrollment} />
                  ))}
                </div>
              </div>
            )}

            {approvedEnrollments.length === 0 && pendingEnrollments.length === 0 && rejectedEnrollments.length === 0 && (
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No enrollments</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by enrolling in a class.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowEnrollModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={availableClasses.length === 0}
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
                    Enroll in Class
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <EnrollModal
          isOpen={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          availableClasses={availableClasses}
          selectedClassId={selectedClassId}
          setSelectedClassId={setSelectedClassId}
          onSubmit={requestEnrollment}
          isSubmitting={loading}
        />
      </div>
    </div>
  );
} 
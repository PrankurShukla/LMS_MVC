'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { classApi } from '@/lib/api';

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

const SignOutModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg max-w-md w-full p-6"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Sign Out Confirmation</h3>
          <p className="mt-2 text-sm text-gray-500">
            Are you sure you want to sign out? You will need to sign in again to access your account.
          </p>
          <div className="mt-6 flex justify-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing out...
                </>
              ) : (
                'Sign Out'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function StudentDashboard() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [enrollmentsResponse, classesResponse] = await Promise.all([
          classApi.getStudentEnrollments(),
          classApi.getAllClasses()
        ]);

        setEnrollments(enrollmentsResponse.data);

        // Filter out classes that the student is already enrolled in or has pending requests
        const enrolledOrPendingClassIds = enrollmentsResponse.data
          .filter((enrollment: Enrollment) => enrollment.status === 'approved' || enrollment.status === 'pending')
          .map((enrollment: Enrollment) => enrollment.class.id);

        const availableClasses = classesResponse.data.filter((cls: Class) => {
          return !enrolledOrPendingClassIds.includes(cls.id);
        });

        setAvailableClasses(availableClasses);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    const token = localStorage.getItem('token');
    if (token) {
      fetchData();
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const requestEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;
    
    try {
      setIsSubmitting(true);
      await classApi.enrollInClass(selectedClassId);
      
      toast.success('Enrollment request sent successfully');
      setShowEnrollModal(false);
      setSelectedClassId(null);
      
      // Refresh data
      const [enrollmentsResponse, classesResponse] = await Promise.all([
        classApi.getStudentEnrollments(),
        classApi.getAllClasses()
      ]);
      
      setEnrollments(enrollmentsResponse.data);
      
      // Filter out classes that the student is already enrolled in
      const enrolledClassIds = enrollmentsResponse.data
        .filter((enrollment: Enrollment) => enrollment.status === 'approved' || enrollment.status === 'pending')
        .map((enrollment: Enrollment) => enrollment.class.id);
      
      setAvailableClasses(classesResponse.data.filter((cls: Class) => 
        !enrolledClassIds.includes(cls.id)
      ));
    } catch (error: any) {
      console.error('Error requesting enrollment:', error);
      toast.error(error.response?.data?.message || 'Failed to request enrollment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader 
          title="Student Dashboard"
          userName={currentUser?.name}
          onSignOut={() => setShowSignOutModal(true)}
        />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="Student Dashboard"
        userName={currentUser?.name}
        onSignOut={() => setShowSignOutModal(true)}
      />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900">My Classes</h2>
          <button
            onClick={() => setShowEnrollModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Enroll in Class
          </button>
        </div>

        {/* Approved Enrollments */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Active Classes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {enrollments
                .filter(enrollment => enrollment.status === 'approved')
                .map(enrollment => (
                  <motion.div
                    key={enrollment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ClassCard enrollment={enrollment} />
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
          {enrollments.filter(e => e.status === 'approved').length === 0 && (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-gray-500">You are not enrolled in any classes yet.</p>
            </div>
          )}
        </div>

        {/* Pending Enrollments */}
        {enrollments.filter(e => e.status === 'pending').length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Enrollments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {enrollments
                  .filter(enrollment => enrollment.status === 'pending')
                  .map(enrollment => (
                    <motion.div
                      key={enrollment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ClassCard enrollment={enrollment} />
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Rejected Enrollments */}
        {enrollments.filter(e => e.status === 'rejected').length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Rejected Enrollments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {enrollments
                  .filter(enrollment => enrollment.status === 'rejected')
                  .map(enrollment => (
                    <motion.div
                      key={enrollment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ClassCard enrollment={enrollment} />
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      <EnrollModal
        isOpen={showEnrollModal}
        onClose={() => {
          setShowEnrollModal(false);
          setSelectedClassId(null);
        }}
        availableClasses={availableClasses}
        selectedClassId={selectedClassId}
        setSelectedClassId={setSelectedClassId}
        onSubmit={requestEnrollment}
        isSubmitting={isSubmitting}
      />

      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleSignOut}
        isLoading={false}
      />
    </div>
  );
} 
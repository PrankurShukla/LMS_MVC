'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import DashboardHeader from '@/components/DashboardHeader';
import { motion } from 'framer-motion';
import { getApiUrl } from '@/lib/apiUrl';

interface Material {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface ClassDetails {
  id: number;
  name: string;
  description?: string;
  teacher: {
    name: string;
  };
}

const LoadingState = () => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      <div className="animate-pulse">
        <div className="flex justify-between items-center mb-8">
          <div className="h-8 w-1/3 bg-gray-200 rounded"></div>
          <div className="h-8 w-32 bg-gray-200 rounded"></div>
        </div>
        
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-6 w-1/4 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 w-1/5 bg-gray-200 rounded mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const EmptyState = () => (
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
    <h3 className="mt-2 text-sm font-medium text-gray-900">No materials yet</h3>
    <p className="mt-1 text-sm text-gray-500">No materials have been added to this class yet.</p>
  </div>
);

const MaterialCard = ({ material }: { material: Material }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-sm overflow-hidden"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{material.title}</h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Posted on {new Date(material.createdAt).toLocaleDateString()}
              {material.updatedAt !== material.createdAt && (
                <span className="ml-2 text-gray-400">
                  (Updated on {new Date(material.updatedAt).toLocaleDateString()})
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              className={`w-5 h-5 text-gray-500 transform transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        <motion.div
          initial={false}
          animate={{ height: isExpanded ? 'auto' : '80px' }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className={`prose max-w-none ${!isExpanded ? 'line-clamp-3' : ''}`}>
            {material.content}
          </div>
          {!isExpanded && material.content.length > 240 && (
            <div className="mt-2">
              <button
                onClick={() => setIsExpanded(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Read more
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default function StudentClassMaterials() {
  const params = useParams();
  const classId = params.id as string;
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

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
        fetchMaterials(token, classId);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking enrollment status:', error);
      setLoading(false);
    }
  };

  const fetchMaterials = async (token: string, classId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${getApiUrl()}/api/classes/${classId}/materials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMaterials(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to fetch course materials');
      setLoading(false);
    }
  };

  if (loading && !classDetails) {
    return <LoadingState />;
  }

  if (!isEnrolled) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">You are not enrolled in this class.</p>
          <div className="mt-6">
            <Link
              href="/student/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{classDetails?.name}</h1>
            <p className="text-gray-500 mt-1">Course Materials</p>
          </div>
          <Link
            href={`/student/classes/${classId}`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="mr-2 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Class
          </Link>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-6 w-1/4 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 w-1/5 bg-gray-200 rounded mb-6"></div>
                <div className="space-y-3">
                  <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                  <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : materials.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {materials.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
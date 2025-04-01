'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import DashboardHeader from '@/components/DashboardHeader';

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
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/${classId}/materials`, {
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
          <DashboardHeader title={`${classDetails?.name} - Materials`} userName={currentUser?.name} />
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
              <div className="text-center py-6">Loading materials...</div>
            ) : materials.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">No materials have been added to this class yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {materials.map((material) => (
                  <div key={material.id} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-4">
                      <h3 className="text-lg font-bold">{material.title}</h3>
                      <div className="text-sm text-gray-500">
                        Posted on {new Date(material.createdAt).toLocaleDateString()}
                        {material.updatedAt !== material.createdAt && 
                          ` (Updated on ${new Date(material.updatedAt).toLocaleDateString()})`
                        }
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="prose max-w-none whitespace-pre-line">
                        {material.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
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
}

export default function TeacherClassMaterials() {
  const params = useParams();
  const classId = params.id as string;
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialContent, setMaterialContent] = useState('');

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
      fetchMaterials(token, classId);
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

  const addMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!materialTitle || !materialContent) {
      toast.error('Title and content are required');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classes/materials`,
        { 
          classId: Number(classId),
          title: materialTitle,
          content: materialContent
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Material added successfully');
      setShowAddModal(false);
      setMaterialTitle('');
      setMaterialContent('');
      
      // Refresh materials
      fetchMaterials(token as string, classId);
    } catch (error) {
      console.error('Error adding material:', error);
      toast.error('Failed to add material');
    }
  };

  const deleteMaterial = async (materialId: number) => {
    if (!confirm('Are you sure you want to delete this material?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/materials/${materialId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Material deleted successfully');
      
      // Refresh materials
      fetchMaterials(token as string, classId);
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Failed to delete material');
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

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <DashboardHeader title={`${classDetails?.name} - Materials`} userName={currentUser?.name} />
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
              Add Material
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            {loading ? (
              <div className="text-center py-6">Loading materials...</div>
            ) : materials.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-4">No materials have been added to this class yet.</p>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                >
                  Add First Material
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {materials.map((material) => (
                  <div key={material.id} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-4 flex justify-between items-center">
                      <h3 className="text-lg font-bold">{material.title}</h3>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => deleteMaterial(material.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="prose max-w-none">
                        {material.content}
                      </div>
                      <div className="mt-4 text-sm text-gray-500">
                        Added on {new Date(material.createdAt).toLocaleDateString()}
                        {material.updatedAt !== material.createdAt && 
                          ` (Updated on ${new Date(material.updatedAt).toLocaleDateString()})`
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Add Course Material</h2>
            <form onSubmit={addMaterial}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="content">
                  Content
                </label>
                <textarea
                  id="content"
                  value={materialContent}
                  onChange={(e) => setMaterialContent(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows={10}
                  required
                />
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
                  Add Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import DashboardHeader from '@/components/DashboardHeader';
import { format } from 'date-fns';

interface Material {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

interface ClassDetails {
  id: number;
  name: string;
  description?: string;
}

const MaterialCard = ({ 
  material, 
  onDelete 
}: { 
  material: Material; 
  onDelete: (id: number) => Promise<void>;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    await onDelete(material.id);
    setIsDeleting(false);
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-200 ${
        isHovered ? 'transform translate-y-[-2px] shadow-md' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{material.title}</h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-3">
            <p className="text-gray-700 whitespace-pre-wrap">{material.content}</p>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            Added on: {new Date(material.createdAt).toLocaleString()}
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`ml-4 p-2 rounded-full hover:bg-red-50 text-red-600 transition-colors ${
            isDeleting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          aria-label="Delete material"
        >
          {isDeleting ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

const AddMaterialModal = ({
  isOpen,
  onClose,
  onSubmit,
  newMaterial,
  setNewMaterial,
  isSubmitting
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  newMaterial: { title: string; content: string };
  setNewMaterial: (material: { title: string; content: string }) => void;
  isSubmitting: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h3 className="text-lg font-semibold mb-4">Add New Material</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={newMaterial.title}
              onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter material title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={newMaterial.content}
              onChange={(e) => setNewMaterial({ ...newMaterial, content: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter material content"
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
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
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
                  Adding...
                </>
              ) : (
                'Add Material'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function TeacherClassMaterials() {
  const params = useParams();
  const classId = params.id as string;
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    content: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to fetch course materials');
    } finally {
      setLoading(false);
    }
  };

  const addMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMaterial.title || !newMaterial.content) {
      toast.error('Title and content are required');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/classes/materials`,
        { 
          classId: Number(classId),
          title: newMaterial.title,
          content: newMaterial.content
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Material added successfully');
      setShowAddModal(false);
      setNewMaterial({
        title: '',
        content: ''
      });
      
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
      setIsDeleting(materialId);
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
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredMaterials = materials.filter((material) => {
    return material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           material.content.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading && !classDetails) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <DashboardHeader title="Loading..." userName={currentUser?.name} />
          <div className="mt-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{classDetails?.name}</h1>
            <p className="text-gray-500">Course Materials</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/teacher/classes/${classId}`}
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
              Back to Class
            </Link>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Material
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="max-w-xl">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search materials..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                <div className="h-6 w-1/3 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                  <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredMaterials.length === 0 ? (
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No materials</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'No materials match your search.' : 'Get started by adding a new material.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                  Add Material
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMaterials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                onDelete={deleteMaterial}
              />
            ))}
          </div>
        )}

        <AddMaterialModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={addMaterial}
          newMaterial={newMaterial}
          setNewMaterial={setNewMaterial}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
} 
import axios from 'axios';
import { getApiUrl } from './apiUrl';

// Create axios instance with default config
const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear auth data on unauthorized or forbidden
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if we're in a browser environment
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API endpoints
export const authApi = {
  login: (data: { email: string; password: string }) => 
    api.post('/api/auth/login', data),
  verifyToken: () => 
    api.get('/api/auth/me'),
};

// User API endpoints
export const userApi = {
  updateProfile: (data: { name: string; email: string; currentPassword?: string; newPassword?: string }) =>
    api.put('/api/users/profile', data),
};

// Class API endpoints
export const classApi = {
  // Teacher endpoints
  getTeacherClasses: () => 
    api.get('/api/classes/teacher/my-classes'),
  createClass: (data: { name: string; description: string }) =>
    api.post('/api/classes', data),
  getClassEnrollments: (classId: number) =>
    api.get(`/api/classes/${classId}/enrollments`),
  getPendingEnrollments: (classId: number) =>
    api.get(`/api/classes/${classId}/enrollments/pending`),
  updateEnrollmentStatus: (enrollmentId: number, status: 'approved' | 'rejected') =>
    api.put(`/api/classes/enrollments/${enrollmentId}/status`, { status }),
  
  // Student endpoints
  getStudentEnrollments: () =>
    api.get('/api/classes/student/my-enrollments'),
  getAllClasses: () =>
    api.get('/api/classes'),
  enrollInClass: (classId: number) =>
    api.post('/api/classes/enroll', { classId }),
};

// Materials API endpoints
export const materialsApi = {
  getClassMaterials: (classId: number) =>
    api.get(`/api/classes/${classId}/materials`),
  createMaterial: (data: { classId: number; title: string; content: string }) =>
    api.post('/api/classes/materials', data),
};

// Assignments API endpoints
export const assignmentsApi = {
  // Teacher endpoints
  getClassAssignments: (classId: number) =>
    api.get(`/api/classes/${classId}/assignments`),
  getAssignmentSubmissions: (assignmentId: number) =>
    api.get(`/api/classes/assignments/${assignmentId}/submissions`),
  gradeSubmission: (submissionId: number, data: { grade: number; feedback: string }) =>
    api.put(`/api/classes/submissions/${submissionId}/grade`, data),
  
  // Student endpoints
  getStudentSubmissions: () =>
    api.get('/api/classes/student/submissions'),
  submitAssignment: (data: { assignmentId: number; content: string }) =>
    api.post('/api/classes/assignments/submit', data),
};

// Admin API endpoints
export const adminApi = {
  getPendingUsers: () =>
    api.get('/api/admin/pending-users'),
  getAllUsers: () =>
    api.get('/api/admin/users'),
}; 
import express from 'express';
import { ClassController } from '../controllers/class.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/roles';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Middleware that applies to all class routes
router.use(authenticateToken);

// ---------- Class Management Routes ----------
// Create a class (only teachers)
router.post(
  '/',
  authorizeRoles([UserRole.teacher]),
  ClassController.createClass
);

// Update a class (only teacher who created the class)
router.put(
  '/:id',
  authorizeRoles([UserRole.teacher]),
  ClassController.updateClass
);

// Delete a class (only teacher who created the class)
router.delete(
  '/:id',
  authorizeRoles([UserRole.teacher]),
  ClassController.deleteClass
);

// Get a class by ID (accessible to anyone)
router.get(
  '/:id',
  ClassController.getClassById
);

// Get classes by logged in teacher
router.get(
  '/teacher/my-classes',
  authorizeRoles([UserRole.teacher]),
  ClassController.getTeacherClasses
);

// Get all classes (accessible to anyone)
router.get(
  '/',
  ClassController.getAllClasses
);

// ---------- Enrollment Management Routes ----------
// Request enrollment in a class (students only)
router.post(
  '/enroll',
  authorizeRoles([UserRole.student]),
  ClassController.requestEnrollment
);

// Update enrollment status (teachers only)
router.put(
  '/enrollments/:id/status',
  authorizeRoles([UserRole.teacher]),
  ClassController.updateEnrollmentStatus
);

// Get all enrollments for a class (teachers only)
router.get(
  '/:classId/enrollments',
  authorizeRoles([UserRole.teacher]),
  ClassController.getEnrollmentsByClassId
);

// Get pending enrollments for a class (teachers only)
router.get(
  '/:classId/enrollments/pending',
  authorizeRoles([UserRole.teacher]),
  ClassController.getPendingEnrollmentsByClassId
);

// Get student enrollments (students only)
router.get(
  '/student/my-enrollments',
  authorizeRoles([UserRole.student]),
  ClassController.getStudentEnrollments
);

// ---------- Course Material Routes ----------
// Create course material (teachers only)
router.post(
  '/materials',
  authorizeRoles([UserRole.teacher]),
  ClassController.createCourseMaterial
);

// Update course material (teachers only)
router.put(
  '/materials/:id',
  authorizeRoles([UserRole.teacher]),
  ClassController.updateCourseMaterial
);

// Delete course material (teachers only)
router.delete(
  '/materials/:id',
  authorizeRoles([UserRole.teacher]),
  ClassController.deleteCourseMaterial
);

// Get materials for a class (accessible to anyone)
router.get(
  '/:classId/materials',
  ClassController.getCourseMaterialsByClassId
);

// ---------- Assignment Routes ----------
// Create assignment (teachers only)
router.post(
  '/assignments',
  authorizeRoles([UserRole.teacher]),
  ClassController.createAssignment
);

// Update assignment (teachers only)
router.put(
  '/assignments/:id',
  authorizeRoles([UserRole.teacher]),
  ClassController.updateAssignment
);

// Delete assignment (teachers only)
router.delete(
  '/assignments/:id',
  authorizeRoles([UserRole.teacher]),
  ClassController.deleteAssignment
);

// Get assignments for a class (accessible to anyone)
router.get(
  '/:classId/assignments',
  ClassController.getAssignmentsByClassId
);

// Get assignment by ID (accessible to anyone)
router.get(
  '/assignments/:id',
  ClassController.getAssignmentById
);

// ---------- Assignment Submission Routes ----------
// Submit assignment (students only)
router.post(
  '/assignments/submit',
  authorizeRoles([UserRole.student]),
  ClassController.submitAssignment
);

// Grade submission (teachers only)
router.put(
  '/submissions/:id/grade',
  authorizeRoles([UserRole.teacher]),
  ClassController.gradeSubmission
);

// Get submissions for an assignment (teachers only)
router.get(
  '/assignments/:assignmentId/submissions',
  authorizeRoles([UserRole.teacher]),
  ClassController.getSubmissionsByAssignmentId
);

// Get student submissions (students only)
router.get(
  '/student/submissions',
  authorizeRoles([UserRole.student]),
  ClassController.getStudentSubmissions
);

// Get specific student submission for an assignment (students only)
router.get(
  '/assignments/:assignmentId/my-submission',
  authorizeRoles([UserRole.student]),
  ClassController.getStudentSubmission
);

export default router; 
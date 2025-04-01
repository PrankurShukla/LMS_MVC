import { Request, Response } from 'express';
import { ClassModel } from '../models/class';
import { EnrollmentStatus } from '@prisma/client';
import prisma from '../lib/prisma';

export class ClassController {
  // ---------- Class Management ----------
  static async createClass(req: Request, res: Response) {
    try {
      console.log('Creating class with request body:', req.body);
      const { name, description } = req.body;
      const teacherId = (req.user as any).userId;

      console.log('User data from token:', req.user);
      console.log('Teacher ID extracted:', teacherId);

      if (!name) {
        return res.status(400).json({ message: 'Class name is required' });
      }

      console.log('About to create class with:', { name, description, teacherId });
      const newClass = await ClassModel.createClass(name, description || '', teacherId);
      console.log('Class created successfully:', newClass);
      return res.status(201).json(newClass);
    } catch (error) {
      console.error('Error creating class - DETAILS:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      });
    }
  }

  static async updateClass(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const teacherId = (req.user as any).userId;
      
      // Verify the teacher owns this class
      const existingClass = await ClassModel.getClassById(Number(id));
      if (!existingClass) {
        return res.status(404).json({ message: 'Class not found' });
      }
      
      if (existingClass.teacherId !== teacherId) {
        return res.status(403).json({ message: 'You are not authorized to update this class' });
      }

      const updatedClass = await ClassModel.updateClass(Number(id), { 
        name, 
        description 
      });
      
      return res.status(200).json(updatedClass);
    } catch (error) {
      console.error('Error updating class:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async deleteClass(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const teacherId = (req.user as any).userId;
      
      // Verify the teacher owns this class
      const existingClass = await ClassModel.getClassById(Number(id));
      if (!existingClass) {
        return res.status(404).json({ message: 'Class not found' });
      }
      
      if (existingClass.teacherId !== teacherId) {
        return res.status(403).json({ message: 'You are not authorized to delete this class' });
      }

      await ClassModel.deleteClass(Number(id));
      return res.status(200).json({ message: 'Class deleted successfully' });
    } catch (error) {
      console.error('Error deleting class:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getClassById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const classData = await ClassModel.getClassById(Number(id));
      
      if (!classData) {
        return res.status(404).json({ message: 'Class not found' });
      }
      
      return res.status(200).json(classData);
    } catch (error) {
      console.error('Error getting class:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getTeacherClasses(req: Request, res: Response) {
    try {
      const teacherId = (req.user as any).userId;
      const classes = await ClassModel.getClassesByTeacherId(teacherId);
      return res.status(200).json(classes);
    } catch (error) {
      console.error('Error getting teacher classes:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getAllClasses(req: Request, res: Response) {
    try {
      const classes = await ClassModel.getAllClasses();
      return res.status(200).json(classes);
    } catch (error) {
      console.error('Error getting all classes:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // ---------- Enrollment Management ----------
  static async requestEnrollment(req: Request, res: Response) {
    try {
      const { classId } = req.body;
      const studentId = (req.user as any).userId;
      
      if (!classId) {
        return res.status(400).json({ message: 'Class ID is required' });
      }

      // Check if class exists
      const classData = await ClassModel.getClassById(Number(classId));
      if (!classData) {
        return res.status(404).json({ message: 'Class not found' });
      }

      // Check if student is the teacher of this class
      if (classData.teacherId === studentId) {
        return res.status(400).json({ message: 'You cannot enroll in your own class' });
      }

      // Check if there's an existing enrollment and what its status is
      const existingEnrollment = await prisma.enrollment.findFirst({
        where: {
          classId: Number(classId),
          studentId
        }
      });

      // Provide a more specific message based on the enrollment status
      if (existingEnrollment) {
        if (existingEnrollment.status === 'approved') {
          return res.status(400).json({ message: 'You are already enrolled in this class' });
        } else if (existingEnrollment.status === 'pending') {
          return res.status(400).json({ message: 'Your enrollment request is already pending approval' });
        }
        // For rejected enrollments, we'll continue to allow a new request
      }

      // Create or update the enrollment
      const enrollment = await ClassModel.requestEnrollment(Number(classId), studentId);
      
      // Check if this was a re-request after rejection
      if (existingEnrollment && existingEnrollment.status === 'rejected') {
        return res.status(201).json({ 
          ...enrollment,
          message: 'Re-enrollment request submitted successfully' 
        });
      }
      
      return res.status(201).json(enrollment);
    } catch (error) {
      console.error('Error requesting enrollment:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async updateEnrollmentStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const teacherId = (req.user as any).userId;
      
      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Valid status (approved or rejected) is required' });
      }

      // Verify the enrollment exists and the teacher owns the class
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: Number(id) },
        include: { class: true }
      });

      if (!enrollment) {
        return res.status(404).json({ message: 'Enrollment not found' });
      }
      
      if (enrollment.class.teacherId !== teacherId) {
        return res.status(403).json({ message: 'You are not authorized to update enrollments for this class' });
      }

      const updatedEnrollment = await ClassModel.updateEnrollmentStatus(
        Number(id), 
        status as EnrollmentStatus
      );
      
      return res.status(200).json(updatedEnrollment);
    } catch (error) {
      console.error('Error updating enrollment status:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getEnrollmentsByClassId(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const teacherId = (req.user as any).userId;
      
      // Verify the teacher owns this class
      const classData = await ClassModel.getClassById(Number(classId));
      if (!classData) {
        return res.status(404).json({ message: 'Class not found' });
      }
      
      if (classData.teacherId !== teacherId) {
        return res.status(403).json({ message: 'You are not authorized to view enrollments for this class' });
      }

      const enrollments = await ClassModel.getEnrollmentsByClassId(Number(classId));
      return res.status(200).json(enrollments);
    } catch (error) {
      console.error('Error getting enrollments by class:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getPendingEnrollmentsByClassId(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const teacherId = (req.user as any).userId;
      
      // Verify the teacher owns this class
      const classData = await ClassModel.getClassById(Number(classId));
      if (!classData) {
        return res.status(404).json({ message: 'Class not found' });
      }
      
      if (classData.teacherId !== teacherId) {
        return res.status(403).json({ message: 'You are not authorized to view enrollments for this class' });
      }

      const pendingEnrollments = await ClassModel.getPendingEnrollmentsByClassId(Number(classId));
      return res.status(200).json(pendingEnrollments);
    } catch (error) {
      console.error('Error getting pending enrollments:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getStudentEnrollments(req: Request, res: Response) {
    try {
      const studentId = (req.user as any).userId;
      const enrollments = await ClassModel.getEnrollmentsByStudentId(studentId);
      return res.status(200).json(enrollments);
    } catch (error) {
      console.error('Error getting student enrollments:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // ---------- Course Material Management ----------
  static async createCourseMaterial(req: Request, res: Response) {
    try {
      const { classId, title, content } = req.body;
      const teacherId = (req.user as any).userId;
      
      if (!classId || !title || !content) {
        return res.status(400).json({ message: 'Class ID, title and content are required' });
      }

      // Verify the teacher owns this class
      const classData = await ClassModel.getClassById(Number(classId));
      if (!classData) {
        return res.status(404).json({ message: 'Class not found' });
      }
      
      if (classData.teacherId !== teacherId) {
        return res.status(403).json({ message: 'You are not authorized to add materials to this class' });
      }

      const material = await ClassModel.createCourseMaterial(title, content, Number(classId));
      return res.status(201).json(material);
    } catch (error) {
      console.error('Error creating course material:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async updateCourseMaterial(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, content } = req.body;
      const teacherId = (req.user as any).userId;
      
      // Verify the material exists and the teacher owns the class
      const material = await prisma.courseMaterial.findUnique({
        where: { id: Number(id) },
        include: { class: true }
      });

      if (!material) {
        return res.status(404).json({ message: 'Course material not found' });
      }
      
      if (material.class.teacherId !== teacherId) {
        return res.status(403).json({ message: 'You are not authorized to update this material' });
      }

      const updatedMaterial = await ClassModel.updateCourseMaterial(Number(id), { title, content });
      return res.status(200).json(updatedMaterial);
    } catch (error) {
      console.error('Error updating course material:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async deleteCourseMaterial(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const teacherId = (req.user as any).userId;
      
      // Verify the material exists and the teacher owns the class
      const material = await prisma.courseMaterial.findUnique({
        where: { id: Number(id) },
        include: { class: true }
      });

      if (!material) {
        return res.status(404).json({ message: 'Course material not found' });
      }
      
      if (material.class.teacherId !== teacherId) {
        return res.status(403).json({ message: 'You are not authorized to delete this material' });
      }

      await ClassModel.deleteCourseMaterial(Number(id));
      return res.status(200).json({ message: 'Course material deleted successfully' });
    } catch (error) {
      console.error('Error deleting course material:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getCourseMaterialsByClassId(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const materials = await ClassModel.getCourseMaterialsByClassId(Number(classId));
      return res.status(200).json(materials);
    } catch (error) {
      console.error('Error getting course materials:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // ---------- Assignment Management ----------
  static async createAssignment(req: Request, res: Response) {
    try {
      const { classId, title, description, dueDate } = req.body;
      const teacherId = (req.user as any).userId;
      
      if (!classId || !title || !description || !dueDate) {
        return res.status(400).json({ message: 'Class ID, title, description, and due date are required' });
      }

      // Verify the teacher owns this class
      const classData = await ClassModel.getClassById(Number(classId));
      if (!classData) {
        return res.status(404).json({ message: 'Class not found' });
      }
      
      if (classData.teacherId !== teacherId) {
        return res.status(403).json({ message: 'You are not authorized to create assignments for this class' });
      }

      const assignment = await ClassModel.createAssignment(
        title,
        description,
        Number(classId),
        new Date(dueDate)
      );
      
      return res.status(201).json(assignment);
    } catch (error) {
      console.error('Error creating assignment:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async updateAssignment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, dueDate } = req.body;
      const teacherId = (req.user as any).userId;
      
      // Verify the assignment exists and the teacher owns the class
      const assignment = await prisma.assignment.findUnique({
        where: { id: Number(id) },
        include: { class: true }
      });

      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      
      if (assignment.class.teacherId !== teacherId) {
        return res.status(403).json({ message: 'You are not authorized to update this assignment' });
      }

      const updatedAssignment = await ClassModel.updateAssignment(
        Number(id), 
        { 
          title, 
          description, 
          dueDate: dueDate ? new Date(dueDate) : undefined 
        }
      );
      
      return res.status(200).json(updatedAssignment);
    } catch (error) {
      console.error('Error updating assignment:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async deleteAssignment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const teacherId = (req.user as any).userId;
      
      // Verify the assignment exists and the teacher owns the class
      const assignment = await prisma.assignment.findUnique({
        where: { id: Number(id) },
        include: { class: true }
      });

      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      
      if (assignment.class.teacherId !== teacherId) {
        return res.status(403).json({ message: 'You are not authorized to delete this assignment' });
      }

      await ClassModel.deleteAssignment(Number(id));
      return res.status(200).json({ message: 'Assignment deleted successfully' });
    } catch (error) {
      console.error('Error deleting assignment:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getAssignmentsByClassId(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const assignments = await ClassModel.getAssignmentsByClassId(Number(classId));
      return res.status(200).json(assignments);
    } catch (error) {
      console.error('Error getting assignments:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getAssignmentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Fetch the assignment with class details using the model method
      const assignment = await ClassModel.getAssignmentById(Number(id));
      
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      
      return res.status(200).json(assignment);
    } catch (error) {
      console.error('Error getting assignment details:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // ---------- Assignment Submission Management ----------
  static async submitAssignment(req: Request, res: Response) {
    try {
      const { assignmentId, content } = req.body;
      const studentId = (req.user as any).userId;
      
      if (!assignmentId || !content) {
        return res.status(400).json({ message: 'Assignment ID and content are required' });
      }

      // Verify the assignment exists
      const assignment = await prisma.assignment.findUnique({
        where: { id: Number(assignmentId) }
      });
      
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      
      // Verify the student is enrolled in the class
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          classId: assignment.classId,
          studentId,
          status: 'approved'
        }
      });
      
      if (!enrollment) {
        return res.status(403).json({ message: 'You are not enrolled in this class' });
      }

      const submission = await ClassModel.submitAssignment(Number(assignmentId), studentId, content);
      return res.status(201).json(submission);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async gradeSubmission(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { grade, feedback } = req.body;
      const teacherId = (req.user as any).userId;
      
      if (grade === undefined || grade < 0 || grade > 100) {
        return res.status(400).json({ message: 'Valid grade (0-100) is required' });
      }

      // Verify the submission exists and the teacher owns the class
      const submission = await prisma.assignmentSubmission.findUnique({
        where: { id: Number(id) },
        include: { 
          assignment: {
            include: {
              class: true
            }
          }
        }
      });

      if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
      }
      
      if (submission.assignment.class.teacherId !== teacherId) {
        return res.status(403).json({ message: 'You are not authorized to grade submissions for this class' });
      }

      const gradedSubmission = await ClassModel.gradeSubmission(
        Number(id),
        Number(grade),
        feedback || ''
      );
      
      return res.status(200).json(gradedSubmission);
    } catch (error) {
      console.error('Error grading submission:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getSubmissionsByAssignmentId(req: Request, res: Response) {
    try {
      const { assignmentId } = req.params;
      const teacherId = (req.user as any).userId;
      
      // Verify the assignment exists and the teacher owns the class
      const assignment = await prisma.assignment.findUnique({
        where: { id: Number(assignmentId) },
        include: { class: true }
      });

      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      
      if (assignment.class.teacherId !== teacherId) {
        return res.status(403).json({ message: 'You are not authorized to view submissions for this assignment' });
      }

      const submissions = await ClassModel.getSubmissionsByAssignmentId(Number(assignmentId));
      return res.status(200).json(submissions);
    } catch (error) {
      console.error('Error getting submissions by assignment:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getStudentSubmissions(req: Request, res: Response) {
    try {
      const studentId = (req.user as any).userId;
      const submissions = await ClassModel.getSubmissionsByStudentId(studentId);
      return res.status(200).json(submissions);
    } catch (error) {
      console.error('Error getting student submissions:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getStudentSubmission(req: Request, res: Response) {
    try {
      const { assignmentId } = req.params;
      const studentId = (req.user as any).userId;
      
      const submission = await ClassModel.getSubmission(Number(assignmentId), studentId);
      return res.status(200).json(submission || null);
    } catch (error) {
      console.error('Error getting student submission:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
} 
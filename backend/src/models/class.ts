import prisma from '../lib/prisma';
import { EnrollmentStatus } from '@prisma/client';

export interface Class {
  id: number;
  name: string;
  description?: string;
  teacherId: number;
  createdAt: Date;
}

export class ClassModel {
  // ---------- Class Management ----------
  static async createClass(name: string, description: string, teacherId: number) {
    return prisma.class.create({
      data: {
        name,
        description,
        teacherId
      }
    });
  }

  static async updateClass(id: number, data: { name?: string; description?: string }) {
    return prisma.class.update({
      where: { id },
      data
    });
  }

  static async deleteClass(id: number) {
    return prisma.class.delete({
      where: { id }
    });
  }

  static async getClassById(id: number) {
    return prisma.class.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  static async getClassesByTeacherId(teacherId: number) {
    return prisma.class.findMany({
      where: {
        teacherId
      },
      include: {
        _count: {
          select: {
            enrollments: {
              where: {
                status: 'approved'
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  static async getAllClasses() {
    return prisma.class.findMany({
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            enrollments: {
              where: {
                status: 'approved'
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  // ---------- Enrollment Management ----------
  static async requestEnrollment(classId: number, studentId: number) {
    // Check if there's an existing enrollment
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        classId,
        studentId
      }
    });

    // If enrollment exists, check its status
    if (existingEnrollment) {
      // If already approved, return the existing enrollment
      if (existingEnrollment.status === EnrollmentStatus.approved) {
        return existingEnrollment;
      }
      
      // If previously rejected or pending, update it to pending
      return prisma.enrollment.update({
        where: { id: existingEnrollment.id },
        data: { status: EnrollmentStatus.pending }
      });
    }

    // If no existing enrollment, create a new one
    return prisma.enrollment.create({
      data: {
        classId,
        studentId,
        status: EnrollmentStatus.pending
      }
    });
  }

  static async updateEnrollmentStatus(id: number, status: EnrollmentStatus) {
    return prisma.enrollment.update({
      where: { id },
      data: { status }
    });
  }

  static async getEnrollmentsByClassId(classId: number) {
    return prisma.enrollment.findMany({
      where: { classId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  static async getEnrollmentsByStudentId(studentId: number) {
    return prisma.enrollment.findMany({
      where: { studentId },
      include: {
        class: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
  }

  static async getPendingEnrollmentsByClassId(classId: number) {
    return prisma.enrollment.findMany({
      where: {
        classId,
        status: EnrollmentStatus.pending
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  // ---------- Course Material Management ----------
  static async createCourseMaterial(title: string, content: string, classId: number) {
    return prisma.courseMaterial.create({
      data: {
        title,
        content,
        classId
      }
    });
  }

  static async updateCourseMaterial(id: number, data: { title?: string; content?: string }) {
    return prisma.courseMaterial.update({
      where: { id },
      data
    });
  }

  static async deleteCourseMaterial(id: number) {
    return prisma.courseMaterial.delete({
      where: { id }
    });
  }

  static async getCourseMaterialsByClassId(classId: number) {
    return prisma.courseMaterial.findMany({
      where: { classId },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  // ---------- Assignment Management ----------
  static async createAssignment(title: string, description: string, classId: number, dueDate: Date) {
    return prisma.assignment.create({
      data: {
        title,
        description,
        classId,
        dueDate
      }
    });
  }

  static async updateAssignment(id: number, data: { title?: string; description?: string; dueDate?: Date }) {
    return prisma.assignment.update({
      where: { id },
      data
    });
  }

  static async deleteAssignment(id: number) {
    return prisma.assignment.delete({
      where: { id }
    });
  }

  static async getAssignmentsByClassId(classId: number) {
    return prisma.assignment.findMany({
      where: { classId },
      orderBy: {
        dueDate: 'asc'
      }
    });
  }

  static async getAssignmentById(id: number) {
    return prisma.assignment.findUnique({
      where: { id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            description: true,
            teacherId: true
          }
        }
      }
    });
  }

  // ---------- Assignment Submission Management ----------
  static async submitAssignment(assignmentId: number, studentId: number, content: string) {
    return prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId
        }
      },
      update: {
        content,
        submittedAt: new Date()
      },
      create: {
        assignmentId,
        studentId,
        content
      }
    });
  }

  static async gradeSubmission(id: number, grade: number, feedback: string) {
    return prisma.assignmentSubmission.update({
      where: { id },
      data: {
        grade,
        feedback,
        gradedAt: new Date()
      }
    });
  }

  static async getSubmissionsByAssignmentId(assignmentId: number) {
    return prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  static async getSubmissionsByStudentId(studentId: number) {
    return prisma.assignmentSubmission.findMany({
      where: { studentId },
      include: {
        assignment: true
      }
    });
  }

  static async getSubmission(assignmentId: number, studentId: number) {
    return prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId
        }
      }
    });
  }
} 
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
    try {
      // Validate inputs
      if (!name || typeof name !== 'string') {
        throw new Error('Invalid class name');
      }
      if (typeof teacherId !== 'number') {
        throw new Error('Invalid teacher ID');
      }

      // Check if teacher exists
      const teacher = await prisma.user.findUnique({
        where: { id: teacherId }
      });

      if (!teacher) {
        throw new Error('Teacher not found');
      }

      if (teacher.role !== 'teacher') {
        throw new Error('User is not a teacher');
      }

      // Create the class
      return prisma.class.create({
        data: {
          name,
          description,
          teacherId
        },
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
    } catch (error) {
      console.error('Error in ClassModel.createClass:', error);
      throw error;
    }
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
        },
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        courseMaterials: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        assignments: {
          orderBy: {
            dueDate: 'asc'
          }
        },
        _count: {
          select: {
            enrollments: {
              where: {
                status: 'approved'
              }
            },
            courseMaterials: true,
            assignments: true
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
    try {
      // Validate inputs
      if (!classId || typeof classId !== 'number') {
        throw new Error('Invalid class ID');
      }
      if (!studentId || typeof studentId !== 'number') {
        throw new Error('Invalid student ID');
      }

      // Check if class exists
      const classExists = await prisma.class.findUnique({
        where: { id: classId }
      });
      if (!classExists) {
        throw new Error('Class not found');
      }

      // Check if student exists and is a student
      const student = await prisma.user.findUnique({
        where: { id: studentId }
      });
      if (!student) {
        throw new Error('Student not found');
      }
      if (student.role !== 'student') {
        throw new Error('User is not a student');
      }

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
        if (existingEnrollment.status === 'approved') {
          return existingEnrollment;
        }
        
        // If previously rejected or pending, update it to pending
        return prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: { status: 'pending' }
        });
      }

      // If no existing enrollment, create a new one
      return prisma.enrollment.create({
        data: {
          classId,
          studentId,
          status: 'pending'
        }
      });
    } catch (error) {
      console.error('Error in ClassModel.requestEnrollment:', error);
      throw error;
    }
  }

  static async updateEnrollmentStatus(id: number, status: EnrollmentStatus) {
    try {
      // Validate inputs
      if (!id || typeof id !== 'number') {
        throw new Error('Invalid enrollment ID');
      }
      if (!Object.values(EnrollmentStatus).includes(status)) {
        throw new Error('Invalid enrollment status');
      }

      // Check if enrollment exists
      const enrollment = await prisma.enrollment.findUnique({
        where: { id }
      });
      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      return prisma.enrollment.update({
        where: { id },
        data: { status }
      });
    } catch (error) {
      console.error('Error in ClassModel.updateEnrollmentStatus:', error);
      throw error;
    }
  }

  static async getEnrollmentsByClassId(classId: number) {
    try {
      // Validate input
      if (!classId || typeof classId !== 'number') {
        throw new Error('Invalid class ID');
      }

      // Check if class exists
      const classExists = await prisma.class.findUnique({
        where: { id: classId }
      });
      if (!classExists) {
        throw new Error('Class not found');
      }

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
    } catch (error) {
      console.error('Error in ClassModel.getEnrollmentsByClassId:', error);
      throw error;
    }
  }

  static async getEnrollmentsByStudentId(studentId: number) {
    try {
      // Validate input
      if (!studentId || typeof studentId !== 'number') {
        throw new Error('Invalid student ID');
      }

      // Check if student exists
      const student = await prisma.user.findUnique({
        where: { id: studentId }
      });
      if (!student) {
        throw new Error('Student not found');
      }

      return prisma.enrollment.findMany({
        where: { 
          studentId,
          status: 'approved'  // Only return approved enrollments
        },
        include: {
          class: {
            include: {
              teacher: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              courseMaterials: {
                orderBy: {
                  createdAt: 'desc'
                }
              },
              assignments: {
                orderBy: {
                  dueDate: 'asc'
                }
              },
              _count: {
                select: {
                  enrollments: {
                    where: {
                      status: 'approved'
                    }
                  },
                  courseMaterials: true,
                  assignments: true
                }
              }
            }
          }
        },
        orderBy: {
          enrolledAt: 'desc'
        }
      });
    } catch (error) {
      console.error('Error in ClassModel.getEnrollmentsByStudentId:', error);
      throw error;
    }
  }

  static async getPendingEnrollmentsByClassId(classId: number) {
    try {
      // Validate input
      if (!classId || typeof classId !== 'number') {
        throw new Error('Invalid class ID');
      }

      // Check if class exists
      const classExists = await prisma.class.findUnique({
        where: { id: classId }
      });
      if (!classExists) {
        throw new Error('Class not found');
      }

      return prisma.enrollment.findMany({
        where: {
          classId,
          status: 'pending'
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
    } catch (error) {
      console.error('Error in ClassModel.getPendingEnrollmentsByClassId:', error);
      throw error;
    }
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
    console.log(`Getting submissions for student ID: ${studentId}`);
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { studentId },
      include: {
        assignment: {
          include: {
            class: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });
    
    console.log(`Found ${submissions.length} submissions for student ID: ${studentId}`);
    submissions.forEach(sub => {
      console.log(`Submission ID: ${sub.id}, Assignment ID: ${sub.assignmentId}, Grade: ${sub.grade}, Feedback: ${sub.feedback?.substring(0, 20)}`);
    });
    
    return submissions;
  }

  static async getSubmission(assignmentId: number, studentId: number) {
    console.log(`Looking for submission for assignment ${assignmentId} by student ${studentId}`);
    
    // First check if the assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    });
    
    if (!assignment) {
      console.log(`Assignment ${assignmentId} not found`);
      return null;
    }
    
    // Check if student is enrolled in the class
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        classId: assignment.classId,
        studentId,
        status: 'approved'
      }
    });
    
    if (!enrollment) {
      console.log(`Student ${studentId} is not enrolled in class ${assignment.classId}`);
      return null;
    }
    
    // Find the submission
    const submission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId
      }
    });
    
    if (submission) {
      console.log(`Submission found for assignment ${assignmentId}:`, {
        id: submission.id,
        grade: submission.grade,
        hasGrade: submission.grade !== null,
        feedback: submission.feedback ? submission.feedback.substring(0, 20) + '...' : 'None'
      });
    } else {
      console.log(`No submission found for assignment ${assignmentId}`);
    }
    
    return submission;
  }
} 
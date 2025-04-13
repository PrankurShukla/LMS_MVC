import prisma from '../lib/prisma';

export interface ClassEnrollment {
  id: number;
  classId: number;
  studentId: number;
  enrolledAt: Date;
}

export class ClassEnrollmentModel {
  static async enrollStudent(classId: number, studentId: number): Promise<ClassEnrollment> {
    return prisma.enrollment.create({
      data: {
        classId,
        studentId,
        status: 'approved',
      },
    });
  }

  static async getStudentEnrollments(studentId: number) {
    return prisma.enrollment.findMany({
      where: { 
        studentId,
        status: 'approved'
      },
      include: {
        class: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            },
            assignments: true
          }
        }
      }
    });
  }

  static async getClassEnrollments(classId: number) {
    return prisma.enrollment.findMany({
      where: { classId },
      include: {
        student: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  static async unenrollStudent(classId: number, studentId: number) {
    return prisma.enrollment.delete({
      where: {
        classId_studentId: {
          classId,
          studentId,
        },
      },
    });
  }

  static async isEnrolled(classId: number, studentId: number): Promise<boolean> {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        classId_studentId: {
          classId,
          studentId,
        },
      },
    });
    
    return !!enrollment;
  }
} 
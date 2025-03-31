import prisma from '../lib/prisma';

export interface ClassEnrollment {
  id: number;
  classId: number;
  studentId: number;
  enrolledAt: Date;
}

export class ClassEnrollmentModel {
  static async enrollStudent(classId: number, studentId: number): Promise<ClassEnrollment> {
    return prisma.classEnrollment.create({
      data: {
        classId,
        studentId,
      },
    });
  }

  static async getStudentEnrollments(studentId: number) {
    return prisma.classEnrollment.findMany({
      where: { studentId },
      include: {
        class: {
          include: {
            teacher: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  static async getClassEnrollments(classId: number) {
    return prisma.classEnrollment.findMany({
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
    return prisma.classEnrollment.delete({
      where: {
        classId_studentId: {
          classId,
          studentId,
        },
      },
    });
  }

  static async isEnrolled(classId: number, studentId: number): Promise<boolean> {
    const enrollment = await prisma.classEnrollment.findUnique({
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
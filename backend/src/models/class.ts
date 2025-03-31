import prisma from '../lib/prisma';

export interface Class {
  id: number;
  name: string;
  description?: string;
  teacherId: number;
  createdAt: Date;
}

export class ClassModel {
  static async createClass(name: string, description: string | undefined, teacherId: number): Promise<Class> {
    return prisma.class.create({
      data: {
        name,
        description,
        teacherId,
      },
    });
  }

  static async getClassById(id: number) {
    return prisma.class.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            email: true,
          },
        },
        enrollments: {
          include: {
            student: {
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

  static async getTeacherClasses(teacherId: number) {
    return prisma.class.findMany({
      where: { teacherId },
      include: {
        enrollments: {
          include: {
            student: {
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

  static async getAllClasses() {
    return prisma.class.findMany({
      include: {
        teacher: {
          select: {
            id: true,
            email: true,
          },
        },
        enrollments: {
          include: {
            student: {
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

  static async deleteClass(id: number) {
    return prisma.class.delete({
      where: { id },
    });
  }
} 
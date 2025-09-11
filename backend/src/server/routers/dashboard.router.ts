// src/server/routers/dashboard.ts
import { router, protectedProcedure, publicProcedure } from "../trpc";
import prisma from "../prisma";

export const dashboardRouter = router({
  getStudentCount: publicProcedure.query(async () => {
    const [totalStudents, totalCourses, passedExams, activeCourses] =
      await Promise.all([
        prisma.student.count(),
        prisma.course.count(),
        prisma.studentCourse.count({
          where: { examResult: true },
        }),
        prisma.course.count({
          where: {
            students: { some: {} },
          },
        }),
      ]);

    return {
      totalStudents,
      totalCourses,
      passedExams,
      activeCourses,
    };
  }),

  getCourseStats: publicProcedure.query(async () => {
    const courses = await prisma.course.findMany({
      include: {
        students: {
          select: {
            id: true,
            examResult: true,
          },
        },
      },
    });

    return courses.map((course) => {
      const totalStudents = course.students.length;
      const passedStudents = course.students.filter(
        (sc) => sc.examResult
      ).length;

      return {
        courseId: course.id,
        courseName: course.name,
        totalStudents,
        passedStudents,
      };
    });
  }),

  getExamStats: protectedProcedure.query(async () => {
    const courses = await prisma.course.findMany({
      include: {
        students: {
          select: {
            examResult: true,
          },
        },
      },
    });

    return courses
      .filter((course) => course.students.length > 0)
      .map((course) => {
        const totalStudents = course.students.length;
        const passedStudents = course.students.filter(
          (sc) => sc.examResult
        ).length;
        const passRate = Math.round((passedStudents / totalStudents) * 100);

        return {
          courseId: course.id,
          courseName: course.name,
          totalStudents,
          passedStudents,
          passRate,
        };
      })
      .sort((a, b) => b.passRate - a.passRate)
      .slice(0, 10);
  }),

  getRecentStudents: protectedProcedure.query(async () => {
    return await prisma.student.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        courses: {
          select: {
            id: true,
            examResult: true,
            course: {
              select: {
                id: true,
                name: true,
                prefix: true,
              },
            },
          },
        },
      },
    });
  }),
});

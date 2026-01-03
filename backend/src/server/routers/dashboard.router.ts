// src/server/routers/dashboard.ts
import { router, protectedProcedure, publicProcedure } from "../trpc";
import prisma from "../prisma";
import { subYears, startOfYear, endOfYear } from "date-fns";
import z from "zod";

export const dashboardRouter = router({
  getStudentCount: publicProcedure
    .input(
      z.object({
        year: z.number().optional().default(new Date().getFullYear()),
      })
    )
    .query(async ({ input }) => {
      const year = input.year || new Date().getFullYear();
      const yearStart = new Date(year, 0, 1); // 1 января
      const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999); // 31 декабря

      // Базовые запросы
      const [
        totalStudents,
        totalCourses,
        passedExams,
        totalStudentsCourses,
        unpassedExams,
      ] = await Promise.all([
        // Студенты с курсами в указанном году
        prisma.student.count({
          where: {
            courses: {
              some: {
                createdAt: {
                  gte: yearStart,
                  lte: yearEnd,
                },
              },
            },
          },
        }),

        // Все курсы в системе
        prisma.course.count(),

        // Сданные экзамены за год
        prisma.studentCourse.count({
          where: {
            examResult: true,
            createdAt: {
              gte: yearStart,
              lte: yearEnd,
            },
          },
        }),

        // Все записи студент-курс за год
        prisma.studentCourse.count({
          where: {
            createdAt: {
              gte: yearStart,
              lte: yearEnd,
            },
          },
        }),

        // Несданные экзамены за год
        prisma.studentCourse.count({
          where: {
            examResult: false,
            createdAt: {
              gte: yearStart,
              lte: yearEnd,
            },
          },
        }),
      ]);

      // Дополнительные запросы для расширенной статистики
      const [activeCourses, studentsWithCertificates, certificatesGenerated] =
        await Promise.all([
          // Активные курсы за год
          prisma.course.count({
            where: {
              students: {
                some: {
                  createdAt: {
                    gte: yearStart,
                    lte: yearEnd,
                  },
                },
              },
            },
          }),

          // Студенты с сертификатами за год
          prisma.student.count({
            where: {
              courses: {
                some: {
                  certificateNumber: { not: null },
                  createdAt: {
                    gte: yearStart,
                    lte: yearEnd,
                  },
                },
              },
            },
          }),

          // Количество выданных сертификатов за год
          prisma.studentCourse.count({
            where: {
              certificateNumber: { not: null },
              createdAt: {
                gte: yearStart,
                lte: yearEnd,
              },
            },
          }),
        ]);

      return {
        totalStudents,
        totalCourses,
        totalStudentsCourses,
        passedExams,
        activeCourses,
        unpassedExams,
        studentsWithCertificates,
        certificatesGenerated,
        year, // Возвращаем год для информации на фронтенде
      };
    }),

  getCourseStats: publicProcedure
    .input(z.object({ year: z.number().optional() }))
    .query(async ({ input }) => {
      // Если год не передан, используем текущий год
      const year = input.year || new Date().getFullYear();

      // Начало и конец года
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

      const courses = await prisma.course.findMany({
        include: {
          students: {
            where: {
              createdAt: {
                gte: yearStart,
                lte: yearEnd,
              },
            },
            select: {
              id: true,
              examResult: true,
              createdAt: true,
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
          successRate:
            totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0,
          year, // Добавляем год для информации на фронтенде
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

  getCourseYearlyStats: protectedProcedure.query(async () => {
    const currentYearStart = startOfYear(new Date());
    const currentYearEnd = endOfYear(new Date());
    const previousYearStart = startOfYear(subYears(new Date(), 1));
    const previousYearEnd = endOfYear(subYears(new Date(), 1));

    const courses = await prisma.course.findMany({
      include: {
        students: {
          select: {
            id: true,
            examResult: true,
            createdAt: true,
          },
        },
      },
    });

    return courses.map((course) => {
      // Статистика за текущий год
      const currentYearStudents = course.students.filter(
        (sc) =>
          sc.createdAt >= currentYearStart && sc.createdAt <= currentYearEnd
      );
      const currentYearPassed = currentYearStudents.filter(
        (sc) => sc.examResult
      );

      // Статистика за прошлый год
      const previousYearStudents = course.students.filter(
        (sc) =>
          sc.createdAt >= previousYearStart && sc.createdAt <= previousYearEnd
      );
      const previousYearPassed = previousYearStudents.filter(
        (sc) => sc.examResult
      );

      return {
        courseId: course.id,
        courseName: course.name,
        currentYear: {
          total: currentYearStudents.length,
          passed: currentYearPassed.length,
        },
        previousYear: {
          total: previousYearStudents.length,
          passed: previousYearPassed.length,
        },
      };
    });
  }),

  // В ваш dashboard router добавьте эту процедуру
  getAvailableYears: publicProcedure.query(async () => {
    // Получаем уникальные годы из createdAt записей studentCourse
    const years = await prisma.studentCourse.findMany({
      select: {
        createdAt: true,
      },
      distinct: ["createdAt"],
    });

    // Извлекаем годы и убираем дубликаты
    const uniqueYears = [
      ...new Set(years.map((item) => new Date(item.createdAt).getFullYear())),
    ].sort((a, b) => b - a); // Сортируем по убыванию (новые годы first)

    // Добавляем текущий год, если его нет в списке
    const currentYear = new Date().getFullYear();
    if (!uniqueYears.includes(currentYear)) {
      uniqueYears.unshift(currentYear);
    }

    return uniqueYears;
  }),
});

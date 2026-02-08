import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import prisma from "../prisma";
import { Prisma } from "@prisma/client";
// Схема для связи студент-курс
const StudentCourseInput = z.object({
  id: z.string().uuid().optional(), // ID для существующих курсов
  courseId: z.string().uuid(),
  examResult: z.boolean().optional().default(false),
  department: z.string(),
  certificateNumber: z.string().optional().nullable(),
  certificateUrl: z.string().optional().nullable(),
  createdAt: z.string().optional(), // Сохраняем дату создания
});

const CreateStudentInput = z.object({
  fullName: z.string().min(3),
  passport: z.string().min(14),
  rank: z.string().optional(),
  phone: z.string().optional(),
  courses: z.array(StudentCourseInput).optional(),
});

const UpdateStudentInput = CreateStudentInput.extend({
  id: z.string().uuid(),
});

export const studentRouter = router({
  // Создание студента с курсами
  create: protectedProcedure
    .input(CreateStudentInput)
    .mutation(async ({ input }) => {
      const { courses, ...studentData } = input;

      return prisma.student.create({
        data: {
          ...studentData,
          phone: studentData?.phone || "",
          rank: studentData?.rank || "",
          courses: {
            create: courses?.map((course) => ({
              course: { connect: { id: course.courseId } },
              examResult: course.examResult,
              department: course.department,
              certificateNumber: course.certificateNumber,
              certificateUrl: course.certificateUrl,
            })),
          },
        },
        include: {
          courses: {
            include: { course: true },
          },
        },
      });
    }),

  // Получение всех студентов с поиском
  getAll: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          department: z.string().optional(),
          courseId: z.string().optional(),
          date: z.string().optional(), // Теперь строка в формате ДД.ММ.ГГГГ
        })
        .optional()
    )
    .query(async ({ input }) => {
      const { search, department, courseId, date } = input || {};

      // Преобразуем строку даты обратно в Date объект для фильтрации
      let dateFilter = {};
      if (date) {
        const [day, month, year] = date.split(".").map(Number);
        const startDate = new Date(year, month - 1, day);
        const endDate = new Date(year, month - 1, day + 1);

        dateFilter = {
          createdAt: {
            gte: startDate,
            lt: endDate,
          },
        };
      }

      return prisma.student.findMany({
        where: {
          AND: [
            {
              courses: {
                some: {
                  ...(courseId && { courseId }),
                  ...(department && { department }),
                  ...dateFilter,
                },
              },
            },
          ],
          OR: search
            ? [
                { fullName: { contains: search, mode: "insensitive" } },
                { passport: { contains: search, mode: "insensitive" } },
                { rank: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
              ]
            : undefined,
        },
        orderBy: { createdAt: "desc" },
        include: {
          courses: {
            include: { course: true },
          },
        },
      });
    }),

  getAvailableDates: protectedProcedure
    .input(
      z
        .object({
          department: z.string().optional(),
          courseId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const { department, courseId } = input || {};

      const studentCourses = await prisma.studentCourse.findMany({
        where: {
          ...(department && { department }),
          ...(courseId && { courseId }),
        },
        select: {
          createdAt: true,
        },
        distinct: ["createdAt"],
        orderBy: {
          createdAt: "desc",
        },
      });

      // Форматируем даты в формат ДД.ММ.ГГГГ
      const formattedDates = studentCourses.map((sc) => {
        const date = new Date(sc.createdAt);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
      });

      // Убираем дубликаты на случай, если несколько записей в один день
      return [...new Set(formattedDates)];
    }),

  export: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          department: z.string().optional(),
          courseId: z.string().optional(),
          date: z.string().optional(),
        })
        .optional()
    )
    .mutation(async ({ input }) => {
      const { department, courseId, date } = input || {};

      // Получаем данные с группировкой
      const studentCourses = await prisma.studentCourse.findMany({
        where: {
          ...(department && { department }),
          ...(courseId && { courseId }),
          ...(date && {
            createdAt: {
              gte: new Date(date.split(".").reverse().join("-")),
              lt: new Date(
                new Date(date.split(".").reverse().join("-")).getTime() +
                  24 * 60 * 60 * 1000
              ),
            },
          }),
        },
        include: {
          student: true,
          course: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      // Группируем по датам
      const groupedByDate = studentCourses.reduce(
        (acc, sc) => {
          const dateKey = sc.createdAt.toLocaleDateString("ru-RU");
          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push(sc);
          return acc;
        },
        {} as Record<string, typeof studentCourses>
      );

      return groupedByDate;
    }),

  // Импорт студентов из файла
  import: protectedProcedure
    .input(z.array(CreateStudentInput))
    .mutation(async ({ input }) => {
      return prisma.$transaction(
        input.map((student) => {
          const { courses, ...studentData } = student;
          return prisma.student.create({
            data: {
              ...studentData,
              phone: studentData?.phone || "",
              rank: studentData?.rank || "",
              courses: {
                create: courses?.map((course) => ({
                  course: { connect: { id: course.courseId } },
                  examResult: course.examResult,
                  department: course.department,
                  certificateNumber: course.certificateNumber,
                  certificateUrl: course.certificateUrl,
                })),
              },
            },
          });
        })
      );
    }),

  // Обновление студента
  update: protectedProcedure
    .input(UpdateStudentInput)
    .mutation(async ({ input }) => {
      const { id, courses, ...data } = input;

      return prisma.$transaction(async (tx) => {
        // Получаем существующие курсы студента
        const existingCourses = await tx.studentCourse.findMany({
          where: { studentId: id },
        });

        const existingCourseIds = existingCourses.map((c) => c.id);
        const inputCourseIds = courses
          ?.filter((c) => c.id)
          .map((c) => c.id!) || [];

        // Удаляем курсы, которых нет в новом списке
        const coursesToDelete = existingCourseIds.filter(
          (cId) => !inputCourseIds.includes(cId)
        );

        if (coursesToDelete.length > 0) {
          await tx.studentCourse.deleteMany({
            where: { id: { in: coursesToDelete } },
          });
        }

        // Обрабатываем курсы из input
        if (courses && courses.length > 0) {
          for (const course of courses) {
            if (course.id) {
              // Обновляем существующий курс, сохраняя createdAt
              const updateData: any = {
                courseId: course.courseId,
                examResult: course.examResult,
                department: course.department,
                certificateNumber: course.certificateNumber,
                certificateUrl: course.certificateUrl,
              };

              // Если передан createdAt, используем его
              if (course.createdAt) {
                updateData.createdAt = new Date(course.createdAt);
              }

              await tx.studentCourse.update({
                where: { id: course.id },
                data: updateData,
              });
            } else {
              // Создаем новый курс
              await tx.studentCourse.create({
                data: {
                  studentId: id,
                  courseId: course.courseId,
                  examResult: course.examResult,
                  department: course.department,
                  certificateNumber: course.certificateNumber,
                  certificateUrl: course.certificateUrl,
                  // createdAt установится автоматически
                },
              });
            }
          }
        }

        // Обновляем данные студента
        return tx.student.update({
          where: { id },
          data,
          include: {
            courses: {
              include: { course: true },
            },
          },
        });
      });
    }),

  // Удаление студента
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return await prisma.$transaction(async (tx) => {
        // Сначала находим студента со всеми его курсами
        const student = await tx.student.findUnique({
          where: { id: input.id },
          include: {
            courses: {
              // Множественное число, если студент может иметь несколько курсов
              include: {
                course: true,
              },
            },
          },
        });

        if (!student) {
          throw new Error("Student not found");
        }

        // Освобождаем номера всех сертификатов студента
        const freeCertificatePromises = student.courses
          .filter((sc) => sc.certificateNumber)
          .map(async (studentCourse) => {
            await markCertificateNumberAsFree(
              studentCourse.course.prefix,
              studentCourse.certificateNumber!
            );
          });

        await Promise.all(freeCertificatePromises);

        // Удаляем все курсы студентаa
        if (student.courses.length > 0) {
          await tx.studentCourse.deleteMany({
            where: { studentId: input.id },
          });
        }

        // Удаляем самого студента
        return tx.student.delete({
          where: { id: input.id },
        });
      });
    }),
  // Обновление связи студент-курс
  updateCourse: protectedProcedure
    .input(
      StudentCourseInput.extend({
        id: z.string().uuid(), // ID связи StudentCourse
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.studentCourse.update({
        where: { id },
        data,
      });
    }),

  getCertificatesByPassport: protectedProcedure
    .input(z.object({ passport: z.string() }))
    .query(async ({ input }) => {
      const student = await prisma.student.findUnique({
        where: { passport: input.passport },
        include: {
          courses: {
            where: {
              certificateNumber: { not: null },
              certificateUrl: { not: null },
            },
            include: {
              course: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      return {
        student: {
          id: student.id,
          fullName: student.fullName,
          passport: student.passport,
        },
        certificates: student.courses.map((sc) => ({
          id: sc.id,
          courseName: sc.course.name,
          certificateNumber: sc.certificateNumber,
          certificateUrl: sc.certificateUrl,
          examResult: sc.examResult,
          createdAt: sc.createdAt,
        })),
      };
    }),

  getCertificatesByPassportOrName: protectedProcedure
    .input(
      z.object({
        passport: z.string().optional(),
        fullName: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { passport, fullName } = input;

      // Проверяем, что хотя бы один параметр предоставлен
      if (!passport && !fullName) {
        throw new Error("Provide either passport or fullName");
      }

      // Строим условие для поиска
      const where: any = {};

      if (passport) {
        where.passport = passport;
      }

      if (fullName) {
        where.fullName = {
          contains: fullName,
          mode: "insensitive" as const,
        };
      }

      const student = await prisma.student.findFirst({
        where,
        include: {
          courses: {
            where: {
              certificateNumber: { not: null },
              certificateUrl: { not: null },
            },
            include: {
              course: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      return {
        student: {
          id: student.id,
          fullName: student.fullName,
          passport: student.passport,
        },
        certificates: student.courses.map((sc) => ({
          id: sc.id,
          courseName: sc.course.name,
          certificateNumber: sc.certificateNumber,
          certificateUrl: sc.certificateUrl,
          examResult: sc.examResult,
          createdAt: sc.createdAt,
        })),
      };
    }),
});

async function markCertificateNumberAsFree(
  prefix: string,
  certificateNumber: string,
  prismaClient?: Prisma.TransactionClient
) {
  const prismaToUse = prismaClient || prisma;

  // Извлекаем числовую часть
  const parts = certificateNumber.split(" ");
  if (parts.length !== 2) return;

  const numberPart = parts[1];
  const num = parseInt(numberPart, 10);
  if (isNaN(num)) return;

  // Находим счетчик
  const counter = await prismaToUse.certificateCounter.findUnique({
    where: { prefix: prefix },
  });

  if (counter) {
    // Добавляем номер в массив свободных
    const updatedFreeNumbers = [...(counter.freeNumbers || []), num].sort(
      (a, b) => a - b
    );

    await prismaToUse.certificateCounter.update({
      where: { prefix: prefix },
      data: { freeNumbers: updatedFreeNumbers },
    });
  }
}

export type StudentRouter = typeof studentRouter;

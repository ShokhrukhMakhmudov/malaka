import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import prisma from "../prisma";

// Схема для связи студент-курс
const StudentCourseInput = z.object({
  courseId: z.string().uuid(),
  examResult: z.boolean().optional().default(false),
  certificateNumber: z.string().optional().nullable(),
  certificateUrl: z.string().optional().nullable(),
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
        })
        .optional()
    )
    .query(async ({ input }) => {
      const search = input?.search || "";
      return prisma.student.findMany({
        where: {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { passport: { contains: search, mode: "insensitive" } },
            { rank: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        include: {
          courses: {
            include: { course: true },
          },
        },
      });
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

      // Удаляем существующие связи
      await prisma.studentCourse.deleteMany({
        where: { studentId: id },
      });

      return prisma.student.update({
        where: { id },
        data: {
          ...data,
          courses: {
            create:
              courses?.map((course) => ({
                courseId: course.courseId,
                examResult: course.examResult,
                certificateNumber: course.certificateNumber,
                certificateUrl: course.certificateUrl,
              })) || [],
          },
        },
        include: {
          courses: {
            include: { course: true },
          },
        },
      });
    }),

  // Удаление студента
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return prisma.student.delete({
        where: { id: input.id },
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
});

export type StudentRouter = typeof studentRouter;

import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import prisma from "../prisma";

// Валидационные схемы
const CreateCourseInput = z.object({
  name: z.string().min(3),
  prefix: z.string().min(2).max(10),
});

const UpdateCourseInput = CreateCourseInput.extend({
  id: z.string().uuid(),
});

// Проверка прав доступа для управления курсами
const hasCourseManagementPermission = (ctx: any) => {
  return (
    ctx.user?.isSuperAdmin || ctx.user?.roles?.includes("COURSE_MANAGEMENT")
  );
};

export const courseRouter = router({
  // Создание курса
  create: protectedProcedure
    .input(CreateCourseInput)
    .mutation(async ({ input, ctx }) => {
      // Проверка прав доступа
      if (!hasCourseManagementPermission(ctx)) {
        throw new Error("Недостаточно прав для создания курса");
      }

      return prisma.course.create({
        data: {
          name: input.name,
          prefix: input.prefix,
        },
      });
    }),

  // Получение всех курсов
  getAll: protectedProcedure.query(async () => {
    return prisma.course.findMany();
  }),

  // Получение курса по ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return prisma.course.findUnique({
        where: { id: input.id },
      });
    }),

  // Обновление курса
  update: protectedProcedure
    .input(UpdateCourseInput)
    .mutation(async ({ input, ctx }) => {
      // Проверка прав доступа
      if (!hasCourseManagementPermission(ctx)) {
        throw new Error("Недостаточно прав для обновления курса");
      }

      const { id, ...data } = input;
      return prisma.course.update({
        where: { id },
        data,
      });
    }),

  // Удаление курса
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Проверка прав доступа
      if (!hasCourseManagementPermission(ctx)) {
        throw new Error("Недостаточно прав для удаления курса");
      }

      return prisma.course.delete({
        where: { id: input.id },
      });
    }),
});

export type CourseRouter = typeof courseRouter;

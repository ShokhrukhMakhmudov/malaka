// src/server/routers/studentCourse.ts
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import prisma from "../prisma";
import { formatISO, startOfDay, endOfDay, subDays, addDays } from "date-fns";

export const studentCourseRouter = router({
  getByDate: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input }) => {
      const { date } = input;
      const targetDate = new Date(date);

      // Начало и конец выбранного дня
      const startOfTarget = startOfDay(targetDate);
      const endOfTarget = endOfDay(targetDate);

      // Получаем курсы студентов за выбранный день
      const studentCourses = await prisma.studentCourse.findMany({
        where: {
          createdAt: {
            gte: startOfTarget,
            lte: endOfTarget,
          },
        },
        include: {
          student: true,
          course: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Находим предыдущую дату с данными
      const prevDateRecord = await prisma.studentCourse.findFirst({
        where: {
          createdAt: {
            lt: startOfTarget,
          },
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      const prevDate = prevDateRecord
        ? formatISO(startOfDay(prevDateRecord.createdAt), {
            representation: "date",
          })
        : null;

      // Находим следующую дату с данными
      const nextDateRecord = await prisma.studentCourse.findFirst({
        where: {
          createdAt: {
            gt: endOfTarget,
          },
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
      const nextDate = nextDateRecord
        ? formatISO(startOfDay(nextDateRecord.createdAt), {
            representation: "date",
          })
        : null;

      return {
        studentCourses,
        prevDate,
        nextDate,
      };
    }),

  bulkUpdateExamResult: protectedProcedure
    .input(
      z.array(
        z.object({
          studentCourseId: z.string(),
          examResult: z.boolean(),
        })
      )
    )
    .mutation(async ({ input }) => {
      // Создаем транзакцию для всех обновлений
      const transactions = input.map(({ studentCourseId, examResult }) =>
        prisma.studentCourse.update({
          where: { id: studentCourseId },
          data: { examResult },
        })
      );

      // Выполняем все обновления в одной транзакции
      await prisma.$transaction(transactions);

      return { success: true, count: input.length };
    }),
});

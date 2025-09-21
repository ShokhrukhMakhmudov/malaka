// src/server/routers/reports.ts
import { router, protectedProcedure } from "../trpc";
import prisma from "../prisma";
import ExcelJS from "exceljs";
import { z } from "zod";

// Вспомогательная функция для очистки имени листа
function sanitizeSheetName(name: string) {
  let sanitized = name.replace(/[\\/*?:[\]]/g, "");
  if (sanitized.length > 31) {
    sanitized = sanitized.substring(0, 31);
  }
  return sanitized;
}

export const reportsRouter = router({
  generateReport: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        month: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { year, month } = input;

      // Определяем временной диапазон
      let startDate: Date, endDate: Date;

      if (month !== undefined) {
        // Конкретный месяц
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0, 23, 59, 59);
      } else {
        // Весь год
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59);
      }

      // Получаем все курсы
      const courses = await prisma.course.findMany({
        include: {
          students: {
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
            include: {
              student: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      // Создаем Excel workbook
      const workbook = new ExcelJS.Workbook();

      // Создаем общий лист с суммарной статистикой
      const summarySheet = workbook.addWorksheet("Umumiy hisobot");

      // Добавляем заголовки для общего листа
      summarySheet.columns = [
        { header: "Kurs", key: "course", width: 30 },
        { header: "Tinglovchilar", key: "totalStudents", width: 15 },
        { header: "Imtihondan o'tganlar", key: "passedStudents", width: 15 },
        { header: "Natija", key: "passPercentage", width: 15 },
        {
          header: "Sertifikatga ega bo'lganlar",
          key: "certificatesIssued",
          width: 15,
        },
      ];

      // Добавляем данные в общий лист
      courses.forEach((course) => {
        const passedStudents = course.students.filter(
          (sc) => sc.examResult
        ).length;
        const certificatesIssued = course.students.filter(
          (sc) => sc.certificateNumber
        ).length;
        const passPercentage =
          course.students.length > 0
            ? Math.round((passedStudents / course.students.length) * 100)
            : 0;

        summarySheet.addRow({
          course: course.name,
          totalStudents: course.students.length,
          passedStudents: passedStudents,
          passPercentage: `${passPercentage}%`,
          certificatesIssued: certificatesIssued,
        });
      });

      // Создаем лист для каждого курса
      courses.forEach((course) => {
        const worksheet = workbook.addWorksheet(sanitizeSheetName(course.name));

        // Добавляем заголовки
        worksheet.columns = [
          { header: "FIO", key: "fullName", width: 30 },
          { header: "Passport (JSHIR)", key: "passport", width: 20 },
          {
            header: "Ro'yhatdan o'tgan sana",
            key: "registrationDate",
            width: 15,
          },
          { header: "Imtihon natijasi", key: "examResult", width: 15 },
          { header: "Sertifikat raqami", key: "certificateNumber", width: 20 },
          { header: "Sertifikat havolasi", key: "certificateUrl", width: 50 },
        ];

        // Заполняем данными
        course.students.forEach((studentCourse) => {
          worksheet.addRow({
            fullName: studentCourse.student.fullName,
            passport: studentCourse.student.passport,
            registrationDate:
              studentCourse.createdAt.toLocaleDateString("ru-RU"),
            examResult: studentCourse.examResult
              ? "Muvaffaqiyatli"
              : "Qoniqarsiz",
            certificateNumber: studentCourse.certificateNumber || "Yo'q",
            certificateUrl: studentCourse.certificateUrl
              ? `${process.env.BASE_URL}${studentCourse.certificateUrl}`
              : "Yo'q",
          });
        });

        // Форматируем заголовки
        worksheet.getRow(1).eachCell((cell) => {
          cell.font = { bold: true };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
          };
        });

        // Автоподбор ширины столбцов
        worksheet.columns.forEach((column) => {
          let maxLength = 0;
          if (column && column.eachCell) {
            column.eachCell({ includeEmpty: true }, (cell) => {
              const columnLength = cell.value
                ? cell.value.toString().length
                : 10;
              if (columnLength > maxLength) {
                maxLength = columnLength;
              }
            });
          }
          column.width = maxLength < 10 ? 10 : maxLength;
        });
      });

      // Форматируем заголовки общего листа
      summarySheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE0E0E0" },
        };
      });

      // Автоподбор ширины столбцов для общего листа
      summarySheet.columns.forEach((column) => {
        let maxLength = 0;
        if (column && column.eachCell) {
          column.eachCell({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
        }
        column.width = maxLength < 10 ? 10 : maxLength;
      });

      // Генерируем буфер
      const buffer = await workbook.xlsx.writeBuffer();

      // Конвертируем в base64
      const base64 = Buffer.from(buffer).toString("base64");

      return base64;
    }),
});

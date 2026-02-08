// src/server/routers/dashboard.ts
import { router, protectedProcedure, publicProcedure } from "../trpc";
import prisma from "../prisma";
import z from "zod";
import ExcelJS from "exceljs";

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

  getExamStats: protectedProcedure
    .input(
      z.object({
        year: z.number().optional().default(new Date().getFullYear()),
      })
    )
    .query(async ({ input }) => {
      const year = input.year || new Date().getFullYear();
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

  getCourseYearlyStats: protectedProcedure
    .input(
      z.object({
        year: z.number().optional().default(new Date().getFullYear()),
      })
    )
    .query(async ({ input }) => {
      const selectedYear = input.year || new Date().getFullYear();
      const currentYearStart = new Date(selectedYear, 0, 1);
      const currentYearEnd = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
      const previousYearStart = new Date(selectedYear - 1, 0, 1);
      const previousYearEnd = new Date(selectedYear - 1, 11, 31, 23, 59, 59, 999);

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
        // Статистика за выбранный год
        const currentYearStudents = course.students.filter(
          (sc) =>
            sc.createdAt >= currentYearStart && sc.createdAt <= currentYearEnd
        );
        const currentYearPassed = currentYearStudents.filter(
          (sc) => sc.examResult
        );

        // Статистика за предыдущий год
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
            year: selectedYear,
            total: currentYearStudents.length,
            passed: currentYearPassed.length,
          },
          previousYear: {
            year: selectedYear - 1,
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

  // Экспорт студентов не сдавших экзамены
  exportFailedStudents: protectedProcedure
    .input(
      z.object({
        year: z.number().optional().default(new Date().getFullYear()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Проверяем, что пользователь - superAdmin
      if (!ctx.user?.isSuperAdmin) {
        throw new Error("Only super admins can export reports");
      }

      const year = input.year;

      console.log(`📊 Exporting failed students for year: ${year}`);

      // Получаем студентов не сдавших экзамены за указанный год
      const studentCourses = await prisma.studentCourse.findMany({
        where: {
          examResult: false,
          createdAt: {
            gte: new Date(`${year}-01-01`),
            lte: new Date(`${year}-12-31`),
          },
        },
        include: {
          student: true,
          course: true,
        },
        orderBy: [{ department: "asc" }, { student: { fullName: "asc" } }],
      });

      console.log(`Found ${studentCourses.length} failed students`);

      if (studentCourses.length === 0) {
        throw new Error(
          `${year} yilda imtihon topshirmagan tinglovchilar topilmadi`
        );
      }

      // Создаем новую книгу Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(
        `Imtihon topshirmaganlar ${year}`
      );

      // Настройка колонок
      worksheet.columns = [
        { header: "№", key: "index", width: 5 },
        { header: "F.I.O", key: "fullName", width: 40 },
        { header: "Pasport", key: "passport", width: 15 },
        { header: "Unvon", key: "rank", width: 20 },
        { header: "Telefon", key: "phone", width: 15 },
        { header: "Kurs", key: "course", width: 50 },
        { header: "Hudud", key: "department", width: 30 },
        { header: "Sana", key: "date", width: 12 },
      ];

      // Стиль для заголовков
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9E1F2" },
      };

      // Группировка по регионам и добавление данных
      let currentDepartment = "";
      let globalIndex = 1;

      studentCourses.forEach((sc) => {
        if (sc.department !== currentDepartment) {
          // Добавляем заголовок региона
          const headerRow = worksheet.addRow({
            index: "",
            fullName: sc.department.toUpperCase(),
            passport: "",
            rank: "",
            phone: "",
            course: "",
            department: "",
            date: "",
          });

          // Стиль для заголовка региона
          headerRow.font = { bold: true, size: 12 };
          headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF4B084" },
          };
          headerRow.alignment = { horizontal: "left" };

          // Объединяем ячейки для названия региона
          worksheet.mergeCells(headerRow.number, 1, headerRow.number, 8);

          currentDepartment = sc.department;
        }

        // Добавляем строку студента
        const createdDate = new Date(sc.createdAt);
        worksheet.addRow({
          index: globalIndex++,
          fullName: sc.student.fullName,
          passport: sc.student.passport,
          rank: sc.student.rank || "-",
          phone: sc.student.phone || "-",
          course: sc.course.name,
          department: sc.department,
          date: `${createdDate.getDate().toString().padStart(2, "0")}.${(createdDate.getMonth() + 1).toString().padStart(2, "0")}.${createdDate.getFullYear()}`,
        });
      });

      // Настройка границ для всех ячеек
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // Генерируем Excel файл в base64
      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      console.log(`✅ Excel file generated successfully`);

      return {
        fileName: `Imtihon_topshirmaganlar_${year}.xlsx`,
        fileData: base64,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    }),
});

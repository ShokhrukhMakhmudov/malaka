// src/server/routers/reports.ts
import { router, protectedProcedure } from "../trpc";
import prisma from "../prisma";
import ExcelJS from "exceljs";
import { z } from "zod";

const regions = [
  "IIV Markaziy apparati",
  "IIV JIED",
  "IIV TvaTOXTD",
  "IIV Akademiyasi",
  "IIV MOI",
  "QR IIV",
  "Andijon viloyati IIB",
  "Buxoro viloyati IIB",
  "Jizzax viloyati IIB",
  "Qashqadaryo viloyati IIB",
  "Navoiy viloyati IIB",
  "Namangan viloyati IIB",
  "Samarqand viloyati IIB",
  "Sirdaryo viloyati IIB",
  "Surxondaryo viloyati IIB",
  "Toshkent shahar IIBB",
  "Toshkent viloyati IIBB",
  "Fargʻona viloyati IIB",
  "Xorazm viloyati IIB",
  "IIV Harbiy tuzilmalar",
];

// Вспомогательная функция для очистки имени листа
function sanitizeSheetName(name: string) {
  let sanitized = name.replace(/[\\/*?:[\]]/g, "");
  if (sanitized.length > 31) {
    sanitized = sanitized.substring(0, 31);
  }
  return sanitized;
}

// Список подразделений из шаблона
const DEPARTMENTS = regions;

// Звания из шаблона
const RANKS = ["podpolkovnik", "mayor", "kapitan", "katta serjant"];

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

      // Получаем данные из базы
      const studentCourses = await prisma.studentCourse.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          student: true,
          course: true,
        },
      });

      // Агрегируем данные по подразделениям и званиям
      const departmentStats: any = {};

      // Инициализируем структуру для всех подразделений
      DEPARTMENTS.forEach((dept) => {
        departmentStats[dept] = {
          total: { podpolkovnik: 0, mayor: 0, kapitan: 0, "katta serjant": 0 },
          participants: {
            podpolkovnik: 0,
            mayor: 0,
            kapitan: 0,
            "katta serjant": 0,
          },
          withCertificate: {
            podpolkovnik: 0,
            mayor: 0,
            kapitan: 0,
            "katta serjant": 0,
          },
          withoutCertificate: {
            podpolkovnik: 0,
            mayor: 0,
            kapitan: 0,
            "katta serjant": 0,
          },
        };
      });

      // Заполняем статистику
      studentCourses.forEach((sc) => {
        const dept = sc.department;
        const rank = sc.course.name.trim().toLowerCase();

        // Пропускаем если подразделение или звание не из нашего списка
        if (!DEPARTMENTS.includes(dept) || !RANKS.includes(rank)) {
          return;
        }

        // Общее количество
        departmentStats[dept].total[rank]++;
        departmentStats[dept].participants[rank]++;

        // Участники учебного сбора (те, кто сдал экзамен и не сдал)
        if (sc.examResult) {
          departmentStats[dept].withCertificate[rank]++;
        } else {
          departmentStats[dept].withoutCertificate[rank]++;
        }
      });

      // Создаем Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Отчет");

      // Заголовок отчета
      worksheet.mergeCells("A1:R1");
      worksheet.getCell("A1").value =
        `"O'quv-karera jarayoni" tizimi asosida xodimlarga navbatdagi maxsus unvonlarni berish uchun o'tkazilgan maxsus malaka oshirish kurslari to'g'risida MA'LUMOT`;
      worksheet.getCell("A1").font = { bold: true, size: 14 };
      worksheet.getCell("A1").alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      // Период отчета
      worksheet.mergeCells("A2:R2");
      worksheet.getCell("A2").value =
        `${year}${month ? ` yil ${month} oy` : " yil"}`;
      worksheet.getCell("A2").font = { bold: true };
      worksheet.getCell("A2").alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      // Заголовки таблицы
      worksheet.mergeCells("A3:A4"); // Т/р
      worksheet.getCell("A3").value = "T/r";

      worksheet.mergeCells("B3:B4"); // Подразделение
      worksheet.getCell("B3").value =
        "IIO tarkibiy tuzilmalari va hududiy bo'linmalari";

      // Тингловчилар сони
      worksheet.mergeCells("C3:F3");
      worksheet.getCell("C3").value = "Tinglovchilar soni";

      // Ўқув йиғинида иштирок этганлар
      worksheet.mergeCells("G3:J3");
      worksheet.getCell("G3").value = "O'quv yig'inida ishtirok etganlar";

      // Сертификатга эга бўлганлар
      worksheet.mergeCells("K3:N3");
      worksheet.getCell("K3").value = "Sertifikatga ega bo'lganlar";

      // Сертификатга эга бўлмаганлар
      worksheet.mergeCells("O3:R3");
      worksheet.getCell("O3").value = "Sertifikatga ega bo'lmaganlar";

      // Подзаголовки званий
      const rankHeaders = ["podpolkovnik", "mayor", "kapitan", "katta serjant"];
      for (let i = 0; i < 4; i++) {
        worksheet.getCell(4, 3 + i).value = rankHeaders[i]; // C4-F4
        worksheet.getCell(4, 7 + i).value = rankHeaders[i]; // G4-J4
        worksheet.getCell(4, 11 + i).value = rankHeaders[i]; // K4-N4
        worksheet.getCell(4, 15 + i).value = rankHeaders[i]; // O4-R4
      }

      // Заполняем данные
      let rowIndex = 5;
      let total: any = {
        total: { podpolkovnik: 0, mayor: 0, kapitan: 0, "katta serjant": 0 },
        participants: {
          podpolkovnik: 0,
          mayor: 0,
          kapitan: 0,
          "katta serjant": 0,
        },
        withCertificate: {
          podpolkovnik: 0,
          mayor: 0,
          kapitan: 0,
          "katta serjant": 0,
        },
        withoutCertificate: {
          podpolkovnik: 0,
          mayor: 0,
          kapitan: 0,
          "katta serjant": 0,
        },
      };

      DEPARTMENTS.forEach((dept, index) => {
        const stats = departmentStats[dept];

        worksheet.getCell(`A${rowIndex}`).value = index + 1; // Т/р
        worksheet.getCell(`B${rowIndex}`).value = dept; // Подразделение

        // Тингловчилар сони
        worksheet.getCell(`C${rowIndex}`).value = stats.total["podpolkovnik"];
        worksheet.getCell(`D${rowIndex}`).value = stats.total["mayor"];
        worksheet.getCell(`E${rowIndex}`).value = stats.total["kapitan"];
        worksheet.getCell(`F${rowIndex}`).value = stats.total["katta serjant"];

        // Ўқув йиғинида иштирок этганлар
        worksheet.getCell(`G${rowIndex}`).value =
          stats.participants["podpolkovnik"];
        worksheet.getCell(`H${rowIndex}`).value = stats.participants["mayor"];
        worksheet.getCell(`I${rowIndex}`).value = stats.participants["kapitan"];
        worksheet.getCell(`J${rowIndex}`).value =
          stats.participants["katta serjant"];

        // Сертификатга эга бўлганлар
        worksheet.getCell(`K${rowIndex}`).value =
          stats.withCertificate["podpolkovnik"];
        worksheet.getCell(`L${rowIndex}`).value =
          stats.withCertificate["mayor"];
        worksheet.getCell(`M${rowIndex}`).value =
          stats.withCertificate["kapitan"];
        worksheet.getCell(`N${rowIndex}`).value =
          stats.withCertificate["katta serjant"];

        // Сертификатга эга бўлмаганлар
        worksheet.getCell(`O${rowIndex}`).value =
          stats.withoutCertificate["podpolkovnik"];
        worksheet.getCell(`P${rowIndex}`).value =
          stats.withoutCertificate["mayor"];
        worksheet.getCell(`Q${rowIndex}`).value =
          stats.withoutCertificate["kapitan"];
        worksheet.getCell(`R${rowIndex}`).value =
          stats.withoutCertificate["katta serjant"];

        // Суммируем в общие итоги
        RANKS.forEach((rank) => {
          total.total[rank] += stats.total[rank];
          total.participants[rank] += stats.participants[rank];
          total.withCertificate[rank] += stats.withCertificate[rank];
          total.withoutCertificate[rank] += stats.withoutCertificate[rank];
        });

        rowIndex++;
      });

      // Итоговая строка
      worksheet.getCell(`A${rowIndex}`).value = "";
      worksheet.getCell(`B${rowIndex}`).value = "Jami";

      // Тингловчилар сони - итог
      worksheet.getCell(`C${rowIndex}`).value = total.total["podpolkovnik"];
      worksheet.getCell(`D${rowIndex}`).value = total.total["mayor"];
      worksheet.getCell(`E${rowIndex}`).value = total.total["kapitan"];
      worksheet.getCell(`F${rowIndex}`).value = total.total["katta serjant"];

      // Ўқув йиғинида иштирок этганлар - итог
      worksheet.getCell(`G${rowIndex}`).value =
        total.participants["podpolkovnik"];
      worksheet.getCell(`H${rowIndex}`).value = total.participants["mayor"];
      worksheet.getCell(`I${rowIndex}`).value = total.participants["kapitan"];
      worksheet.getCell(`J${rowIndex}`).value =
        total.participants["katta serjant"];

      // Сертификатга эга бўлганлар - итог
      worksheet.getCell(`K${rowIndex}`).value =
        total.withCertificate["podpolkovnik"];
      worksheet.getCell(`L${rowIndex}`).value = total.withCertificate["mayor"];
      worksheet.getCell(`M${rowIndex}`).value =
        total.withCertificate["kapitan"];
      worksheet.getCell(`N${rowIndex}`).value =
        total.withCertificate["katta serjant"];

      // Сертификатга эга бўлмаганлар - итог
      worksheet.getCell(`O${rowIndex}`).value =
        total.withoutCertificate["podpolkovnik"];
      worksheet.getCell(`P${rowIndex}`).value =
        total.withoutCertificate["mayor"];
      worksheet.getCell(`Q${rowIndex}`).value =
        total.withoutCertificate["kapitan"];
      worksheet.getCell(`R${rowIndex}`).value =
        total.withoutCertificate["katta serjant"];

      // Форматирование
      // Устанавливаем стили для заголовков
      for (let row = 3; row <= 4; row++) {
        for (let col = 1; col <= 18; col++) {
          const cell = worksheet.getCell(row, col);
          cell.font = { bold: true };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
          };
          cell.alignment = {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
          };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        }
      }

      // Устанавливаем стили для данных
      for (let row = 5; row <= rowIndex; row++) {
        for (let col = 1; col <= 18; col++) {
          const cell = worksheet.getCell(row, col);
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          if (col >= 3) {
            // Числовые колонки
            cell.alignment = { horizontal: "center" };
          }
        }
      }

      // Устанавливаем ширину колонок
      worksheet.columns = [
        { width: 5 }, // A: Т/р
        { width: 35 }, // B: Подразделение
        { width: 10 }, // C: podpolkovnik (total)
        { width: 10 }, // D: mayor (total)
        { width: 10 }, // E: kapitan (total)
        { width: 10 }, // F: katta serjant (total)
        { width: 10 }, // G: podpolkovnik (participants)
        { width: 10 }, // H: mayor (participants)
        { width: 10 }, // I: kapitan (participants)
        { width: 10 }, // J: katta serjant (participants)
        { width: 10 }, // K: podpolkovnik (with cert)
        { width: 10 }, // L: mayor (with cert)
        { width: 10 }, // M: kapitan (with cert)
        { width: 10 }, // N: katta serjant (with cert)
        { width: 10 }, // O: podpolkovnik (without cert)
        { width: 10 }, // P: mayor (without cert)
        { width: 10 }, // Q: kapitan (without cert)
        { width: 10 }, // R: katta serjant (without cert)
      ];

      // Генерируем буфер
      const buffer = await workbook.xlsx.writeBuffer();

      // Конвертируем в base64
      const base64 = Buffer.from(buffer).toString("base64");

      return base64;
    }),
});

export type ReportsRouter = typeof reportsRouter;

import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "./context";
import prisma from "./prisma";
import { generateToken } from "./utils/jwt";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { appRouter } from "./routers/_app";
import fs from "fs";
import path from "path";
import { PDFDocument, rgb } from "pdf-lib";
import fontKit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import { formatDate } from "date-fns";
import { StudentCourse } from "../generated/prisma";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

// Настройка CORS
const corsOptions = {
  origin: "http://localhost:4000",
};

app.use(cors(corsOptions));

app.use(express.json());

// tRPC роутер
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.post("/api/login", express.json(), async (req, res) => {
  try {
    const { login, password } = req.body;

    // 1. Сначала проверяем супер-админа
    const admin = await prisma.superAdmin.findUnique({
      where: { login },
    });

    if (admin) {
      const passwordMatch = await bcrypt.compare(password, admin.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Parol yoki login noto'g'ri!" });
      }

      const token = generateToken({
        id: admin.id,
        login: admin.login,
        isSuperAdmin: true,
      });

      return res.json({
        token,
        user: {
          id: admin.id,
          login: admin.login,
          name: admin.name,
          isSuperAdmin: true,
        },
      });
    }

    // 2. Если супер-админ не найден, проверяем обычных пользователей
    const user = await prisma.user.findUnique({
      where: { login },
    });

    if (!user) {
      // Не сообщаем, что именно неверно (логин или пароль) в целях безопасности
      return res.status(401).json({ error: "Parol yoki login noto'g'ri!" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Parol yoki login noto'g'ri!" });
    }

    const token = generateToken({
      id: user.id,
      login: user.login,
      roles: user.roles,
      isSuperAdmin: false,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        roles: user.roles,
        isSuperAdmin: false,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Server xatosi" });
  }
});
app.post("/api/students/import", async (req, res) => {
  try {
    const { courseId, students, department } = req.body;

    if (!courseId || !students || !department || students.length === 0) {
      return res.status(400).json({ error: "Invalid data" });
    }

    // Проверяем существование курса
    const courseExists = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!courseExists) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Счётчики для результатов
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // Обрабатываем каждого студента
    for (const student of students) {
      try {
        // Проверяем обязательные поля
        if (!student.fullName || !student.passport) {
          skippedCount++;
          continue;
        }

        // Проверяем существование студента по паспорту
        const existingStudent = await prisma.student.findUnique({
          where: { passport: student.passport },
          include: { courses: true },
        });

        if (existingStudent) {
          // Проверяем, есть ли уже связь с этим курсом
          const hasCourse = existingStudent.courses.some(
            (sc: StudentCourse) => sc.courseId === courseId
          );

          if (hasCourse) {
            // Связь уже существует - пропускаем
            skippedCount++;
            continue;
          }

          // Добавляем новый курс к существующему студенту
          await prisma.studentCourse.create({
            data: {
              studentId: existingStudent.id,
              courseId,
              department,
              examResult: student.examResult || false,
              certificateNumber: null,
              certificateUrl: null,
            },
          });

          updatedCount++;
        } else {
          // Создаем нового студента с курсом
          await prisma.student.create({
            data: {
              fullName: student.fullName,
              passport: student.passport,
              rank: student.rank || null,
              phone: student.phone || null,
              courses: {
                create: {
                  courseId,
                  department,
                  examResult: student.examResult || false,
                  certificateNumber: null,
                  certificateUrl: null,
                },
              },
            },
          });

          createdCount++;
        }
      } catch (error) {
        console.error(`Error processing student ${student.passport}:`, error);
        skippedCount++;
      }
    }

    res.json({
      success: true,
      stats: {
        created: createdCount,
        updated: updatedCount,
        skipped: skippedCount,
        total: students.length,
      },
    });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Certificate generate

const TEMPLATE_COORDINATES: {
  [key: string]: {
    x: number | "center";
    y: number;
    size?: number; // add size as an optional property
  };
} = {
  fullName: { x: "center", y: 340 },
  courseName: { x: "center", y: 470 },
  certificateSeries: { x: "center", y: 372 },
  description: { x: "center", y: 310 },
  date: { x: 232, y: 71 },
  certificateNumber: { x: 709, y: 69 },
  qrCode: { x: 50, y: 30, size: 105 },
};

// Хелпер для разбивки и очистки строк
const splitAndClean = (text: string) =>
  text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

app.post("/certificate/generate", async (req, res) => {
  try {
    const { studentCourseId, message, date, additionalMessage } = req.body;

    // Получаем данные о курсе студента
    const studentCourse = await prisma.studentCourse.findUnique({
      where: { id: studentCourseId },
      include: {
        student: true,
        course: true,
      },
    });

    if (!studentCourse) {
      return res.status(404).json({ message: "Student course not found" });
    }

    if (!studentCourse.examResult) {
      return res.status(400).json({ message: "Student did not pass the exam" });
    }

    // Получаем или создаем счетчик для префикса курса
    let counter = await prisma.certificateCounter.findUnique({
      where: { prefix: studentCourse.course.prefix },
    });

    if (!counter) {
      counter = await prisma.certificateCounter.create({
        data: {
          prefix: studentCourse.course.prefix,
          lastCount: 0,
        },
      });
    }

    // Генерируем новый номер сертификата
    let certificateNumber;
    const nextCount = counter.lastCount + 1;

    if (studentCourse.certificateNumber) {
      certificateNumber = studentCourse.certificateNumber.slice(3);
    } else {
      certificateNumber = nextCount.toString().padStart(5, "0");
    }

    const certificateSeries = `${studentCourse.course.prefix} ${certificateNumber}`;

    // Проверяем, не существует ли уже такого номера
    const exists = await prisma.studentCourse.findFirst({
      where: { certificateNumber: certificateSeries },
    });

    if (exists && studentCourse.certificateNumber !== certificateSeries) {
      return res
        .status(400)
        .json({ message: "Certificate number already exists" });
    }

    if (!studentCourse.certificateNumber) {
      // Обновляем счетчик
      await prisma.certificateCounter.update({
        where: { id: counter.id },
        data: { lastCount: nextCount },
      });
    }

    // Путь к шаблону PDF
    const templatePath = path.join(__dirname, "../template/template.pdf");

    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ message: "PDF template not found" });
    }

    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontKit);

    // Путь к шрифтам
    const fontPath = path.join(__dirname, "../fonts/TimesNewRomanMTStd.ttf");
    const fontItalicPath = path.join(
      __dirname,
      "../fonts/TimesNewRomanMTStd-Italic.ttf"
    );
    const fontBoldPath = path.join(
      __dirname,
      "../fonts/TimesNewRomanMTStd-Bold.ttf"
    );

    if (!fs.existsSync(fontPath) || !fs.existsSync(fontBoldPath)) {
      return res.status(500).json({ message: "Font files not found" });
    }

    const customFont = fs.readFileSync(fontPath);
    const customFontBold = fs.readFileSync(fontBoldPath);
    const customFontItalic = fs.readFileSync(fontItalicPath);
    const fontReg = await pdfDoc.embedFont(customFont);
    const fontRegItalic = await pdfDoc.embedFont(customFontItalic);
    const fontBold = await pdfDoc.embedFont(customFontBold);

    // Получаем первую страницу
    const pages = pdfDoc.getPages();
    const page = pages[0];

    // Добавляем текст
    const addText = (
      text: string,
      x: "center" | number,
      y: number,
      size = 12,
      font = fontReg
    ) => {
      let xPos = x;
      if (x === "center") {
        const textWidth = font.widthOfTextAtSize(text, size);
        xPos = 50 + (page.getWidth() - textWidth) / 2;
      }

      page.drawText(text, {
        x: xPos as number,
        y, // Инвертируем Y-координату
        size,
        font,
        color: rgb(0, 0, 0),
      });
    };

    // ФИО студента
    addText(
      studentCourse.student.fullName.toUpperCase(),
      TEMPLATE_COORDINATES.fullName.x,
      TEMPLATE_COORDINATES.fullName.y,
      18,
      fontBold
    );

    // Название курса
    addText(
      // `${studentCourse.course.name} haqida`,
      `Malaka oshirish haqida`,
      TEMPLATE_COORDINATES.courseName.x,
      TEMPLATE_COORDINATES.courseName.y,
      18
    );

    // Серийный номер сертификата
    addText(
      certificateSeries,
      TEMPLATE_COORDINATES.certificateSeries.x,
      TEMPLATE_COORDINATES.certificateSeries.y,
      13,
      fontBold
    );

    // Номер сертификата
    addText(
      certificateNumber,
      TEMPLATE_COORDINATES.certificateNumber.x,
      TEMPLATE_COORDINATES.certificateNumber.y,
      10,
      fontRegItalic
    );

    // Описание

    // Разбиваем и фильтруем основное и дополнительное сообщение
    const mainLines = splitAndClean(message);
    const additionalLines = splitAndClean(additionalMessage);

    const messageLines = [...mainLines, ...additionalLines];

    // Индекс, начиная с которого текст должен быть жирным
    const boldStartIndex = mainLines.length;

    messageLines.forEach((line, index) => {
      const font = index >= boldStartIndex ? fontBold : fontReg;

      addText(
        line,
        TEMPLATE_COORDINATES.description.x,
        TEMPLATE_COORDINATES.description.y - 30 * index,
        16,
        font
      );
    });

    // Дата выдачи
    addText(
      formatDate(date, "dd.MM.yyyy"),
      TEMPLATE_COORDINATES.date.x,
      TEMPLATE_COORDINATES.date.y,
      11,
      fontRegItalic
    );

    // Генерация QR-кода
    const qrUrl = `${process.env.BASE_URL}/certificates/${certificateSeries
      .replace(/\s+/g, "")
      .replace(/№/g, "")}.pdf`;
    const qrImage = await QRCode.toBuffer(qrUrl);
    const embeddedQr = await pdfDoc.embedPng(qrImage);
    page.drawImage(embeddedQr, {
      x: TEMPLATE_COORDINATES.qrCode.x as number,
      y: TEMPLATE_COORDINATES.qrCode.y,
      width: TEMPLATE_COORDINATES.qrCode.size,
      height: TEMPLATE_COORDINATES.qrCode.size,
    });

    // Сохранение PDF
    const pdfBytes = await pdfDoc.save();
    const outputDir = path.join(
      __dirname,
      "../../../frontend/public/certificates"
    );

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `${certificateSeries.replace(/\s+/g, "").replace(/№/g, "")}.pdf`;
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, pdfBytes);

    // Обновление записи в БД
    await prisma.studentCourse.update({
      where: { id: studentCourseId },
      data: {
        certificateNumber: certificateSeries,
        certificateUrl: `/certificates/${fileName}`,
      },
    });

    return res.status(200).json({
      success: true,
      certificateUrl: `/certificates/${fileName}`,
    });
  } catch (error) {
    console.error("Certificate generation error:", error);
    let message = error;
    if (error instanceof Error) {
      message = error.message || "Certificate generation failed";
    }
    return res.status(500).json({
      success: false,
      message,
    });
  }
});

app.post("/api/student", async (req, res) => {
  try {
    const { student, courseId, certificateData } = req.body;

    // Проверка обязательных полей
    if (!student || !student.fullName || !student.passport || !courseId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Проверка существования курса
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Поиск существующего студента
    let studentRecord = await prisma.student.findUnique({
      where: { passport: student.passport },
    });

    // Создание студента если не существует
    if (!studentRecord) {
      studentRecord = await prisma.student.create({
        data: {
          fullName: student.fullName,
          passport: student.passport,
          rank: student.rank || null,
          phone: student.phone || null,
        },
      });
    }

    // Проверка связи студент-курс
    let studentCourse = await prisma.studentCourse.findFirst({
      where: {
        studentId: studentRecord.id,
        courseId: courseId,
      },
    });

    // Создание связи если не существует
    if (!studentCourse) {
      studentCourse = await prisma.studentCourse.create({
        data: {
          studentId: studentRecord.id,
          courseId: courseId,
          department: student.department,
          examResult: student.examResult || false,
        },
      });
    }

    // Генерация сертификата если запрошена
    let certificateResponse = null;
    if (certificateData && studentCourse.examResult) {
      certificateResponse = await generateCertificate({
        studentCourseId: studentCourse.id,
        message:
          certificateData.message || "Kursni muvaffaqiyatli tamomlagani uchun",
        additionalMessage: certificateData.additionalMessage,
        date: certificateData.date || new Date().toISOString().split("T")[0],
      });
    }

    // Формирование ответа
    const response = {
      success: true,
      student: studentRecord,
      studentCourse,
      certificate: certificateResponse,
    };

    return res.json(response);
  } catch (error) {
    console.error("Error creating student:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Функция генерации сертификата (аналогичная вашему роуту /certificate/generate)
async function generateCertificate({
  studentCourseId,
  message,
  additionalMessage,
  date,
}: {
  studentCourseId: string;
  message: string;
  additionalMessage: string;
  date: string;
}) {
  try {
    // Получаем данные о курсе студента
    const studentCourse = await prisma.studentCourse.findUnique({
      where: { id: studentCourseId },
      include: {
        student: true,
        course: true,
      },
    });

    if (!studentCourse) {
      throw new Error("Student course not found");
    }

    if (!studentCourse.examResult) {
      throw new Error("Student did not pass the exam");
    }

    // Получаем или создаем счетчик для префикса курса
    let counter = await prisma.certificateCounter.findUnique({
      where: { prefix: studentCourse.course.prefix },
    });

    if (!counter) {
      counter = await prisma.certificateCounter.create({
        data: {
          prefix: studentCourse.course.prefix,
          lastCount: 0,
        },
      });
    }

    // Генерируем новый номер сертификата
    let certificateNumber;

    if (studentCourse.certificateNumber) {
      certificateNumber = studentCourse.certificateNumber.slice(3);
    } else {
      const nextCount = counter.lastCount + 1;
      certificateNumber = nextCount.toString().padStart(5, "0");
    }

    const certificateSeries = `${studentCourse.course.prefix} ${certificateNumber}`;

    // Проверяем, не существует ли уже такого номера
    const exists = await prisma.studentCourse.findFirst({
      where: { certificateNumber: certificateSeries },
    });

    if (exists && studentCourse.certificateNumber !== certificateSeries) {
      throw new Error("Certificate number already exists");
    }

    if (!studentCourse.certificateNumber) {
      const nextCount = counter.lastCount + 1;

      // Обновляем счетчик
      await prisma.certificateCounter.update({
        where: { id: counter.id },
        data: { lastCount: nextCount },
      });
    }
    // Путь к шаблону PDF
    const templatePath = path.join(__dirname, "../template/template.pdf");

    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontKit);

    // Путь к шрифтам
    const fontPath = path.join(__dirname, "../fonts/Roboto-Regular.ttf");
    const fontItalicPath = path.join(__dirname, "../fonts/Roboto-Italic.ttf");
    const fontBoldPath = path.join(__dirname, "../fonts/Roboto-Bold.ttf");

    const customFont = fs.readFileSync(fontPath);
    const customFontBold = fs.readFileSync(fontBoldPath);
    const customFontItalic = fs.readFileSync(fontItalicPath);
    const fontReg = await pdfDoc.embedFont(customFont);
    const fontRegItalic = await pdfDoc.embedFont(customFontItalic);
    const fontBold = await pdfDoc.embedFont(customFontBold);

    // Получаем первую страницу
    const pages = pdfDoc.getPages();
    const page = pages[0];

    // Добавляем текст
    const addText = (
      text: string,
      x: "center" | number,
      y: number,
      size = 12,
      font = fontReg
    ) => {
      let xPos = x;
      if (x === "center") {
        const textWidth = font.widthOfTextAtSize(text, size);
        xPos = 50 + (page.getWidth() - textWidth) / 2;
      }

      page.drawText(text, {
        x: xPos as number,
        y, // Инвертируем Y-координату
        size,
        font,
        color: rgb(0, 0, 0),
      });
    };

    // ФИО студента
    addText(
      studentCourse.student.fullName.toUpperCase(),
      TEMPLATE_COORDINATES.fullName.x,
      TEMPLATE_COORDINATES.fullName.y,
      18,
      fontBold
    );

    // Название курса
    addText(
      // `${studentCourse.course.name} haqida`,
      `Malaka oshirish haqida`,
      TEMPLATE_COORDINATES.courseName.x,
      TEMPLATE_COORDINATES.courseName.y,
      18
    );

    // Серийный номер сертификата
    addText(
      certificateSeries,
      TEMPLATE_COORDINATES.certificateSeries.x,
      TEMPLATE_COORDINATES.certificateSeries.y,
      13,
      fontBold
    );

    // Номер сертификата
    addText(
      certificateNumber,
      TEMPLATE_COORDINATES.certificateNumber.x,
      TEMPLATE_COORDINATES.certificateNumber.y,
      10,
      fontRegItalic
    );

    // Описание

    // Разбиваем и фильтруем основное и дополнительное сообщение
    const mainLines = splitAndClean(message);
    const additionalLines = splitAndClean(additionalMessage);

    const messageLines = [...mainLines, ...additionalLines];

    // Индекс, начиная с которого текст должен быть жирным
    const boldStartIndex = mainLines.length;

    messageLines.forEach((line, index) => {
      const font = index >= boldStartIndex ? fontBold : fontReg;

      addText(
        line,
        TEMPLATE_COORDINATES.description.x,
        TEMPLATE_COORDINATES.description.y - 30 * index,
        16,
        font
      );
    });

    // Дата выдачи
    addText(
      formatDate(date, "dd.MM.yyyy"),
      TEMPLATE_COORDINATES.date.x,
      TEMPLATE_COORDINATES.date.y,
      11,
      fontRegItalic
    );

    // Генерация QR-кода
    const qrUrl = `${process.env.BASE_URL}/certificates/${certificateSeries
      .replace(/\s+/g, "")
      .replace(/№/g, "")}.pdf`;
    const qrImage = await QRCode.toBuffer(qrUrl);
    const embeddedQr = await pdfDoc.embedPng(qrImage);
    page.drawImage(embeddedQr, {
      x: TEMPLATE_COORDINATES.qrCode.x as number,
      y: TEMPLATE_COORDINATES.qrCode.y,
      width: TEMPLATE_COORDINATES.qrCode.size,
      height: TEMPLATE_COORDINATES.qrCode.size,
    });

    // Сохранение PDF
    const pdfBytes = await pdfDoc.save();
    const outputDir = path.join(
      __dirname,
      "../../../frontend/public/certificates"
    );

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `${certificateSeries.replace(/\s+/g, "").replace(/№/g, "")}.pdf`;
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, pdfBytes);

    // Обновление записи в БД
    await prisma.studentCourse.update({
      where: { id: studentCourseId },
      data: {
        certificateNumber: certificateSeries,
        certificateUrl: `/certificates/${fileName}`,
      },
    });

    // Возвращаем информацию о сертификате
    return {
      success: true,
      certificateUrl: `/certificates/${fileName}`,
      certificateNumber: certificateSeries,
    };
  } catch (error) {
    console.error("Certificate generation error:", error);
    let message = error;
    if (error instanceof Error) {
      message = error.message || "Certificate generation failed";
    }

    return {
      success: false,
      error: message || "Certificate generation failed",
    };
  }
}
// Инициализация первого супер-админа при запуске
async function initializeFirstAdmin() {
  const adminCount = await prisma.superAdmin.count();

  if (adminCount === 0) {
    const defaultLogin = process.env.DEFAULT_ADMIN_LOGIN || "admin";
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";
    const defaultName = process.env.DEFAULT_ADMIN_NAME || "Super Admin";

    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await prisma.superAdmin.create({
      data: {
        login: defaultLogin,
        password: hashedPassword,
        name: defaultName,
      },
    });

    console.log(`Created first super admin: ${defaultLogin}`);
  }
}

// Запуск сервера
app.listen(PORT, async () => {
  await initializeFirstAdmin();
  console.log(`Server running on http://localhost:${PORT}`);
});

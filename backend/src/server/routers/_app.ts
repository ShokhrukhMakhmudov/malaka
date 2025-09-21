import { t } from "../trpc";
import { authRouter } from "./auth.router";
import { courseRouter } from "./course.router";
import { dashboardRouter } from "./dashboard.router";
import { reportsRouter } from "./reports.router";
import { studentRouter } from "./student.router";
import { studentCourseRouter } from "./studentCourse.router";

export const appRouter = t.router({
  auth: authRouter,
  course: courseRouter,
  student: studentRouter,
  studentCourse: studentCourseRouter,
  dashboard: dashboardRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;

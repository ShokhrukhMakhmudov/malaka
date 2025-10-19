import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";
import prisma from "./prisma";

export const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

// Middleware для проверки аутентификации
const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
const isSuperAdmin = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // Проверка, что пользователь - супер-админ
  const admin = await prisma.superAdmin.findUnique({
    where: { id: ctx.user.id },
  });

  if (!admin) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const superAdminProcedure = t.procedure.use(isSuperAdmin);

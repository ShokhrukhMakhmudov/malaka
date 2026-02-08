import { router, publicProcedure, protectedProcedure } from "../trpc";
import { z } from "zod";
import bcrypt from "bcrypt";
import prisma from "../prisma";
import { generateToken, verifyToken } from "../utils/jwt";

// Определение ролей
export const Role = z.enum(["READ", "EDIT", "CREATE", "COURSE_MANAGEMENT"]);
export type Role = z.infer<typeof Role>;

// Схема для массива ролей
const Roles = z.array(Role).min(1, "At least one role is required");

export const authRouter = router({
  // Создание супер-админа (только для первого пользователя)
  createSuperAdmin: publicProcedure
    .input(
      z.object({
        login: z.string().min(3),
        password: z.string().min(8),
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // Проверяем, есть ли уже супер-админы
      const existingAdmins = await prisma.superAdmin.count();
      if (existingAdmins > 0) {
        throw new Error("Super admin already exists");
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const admin = await prisma.superAdmin.create({
        data: {
          login: input.login,
          password: hashedPassword,
          name: input.name,
          isMainAdmin: true, // Первый superAdmin всегда главный
        },
      });

      return {
        id: admin.id,
        login: admin.login,
        name: admin.name,
        isMainAdmin: admin.isMainAdmin,
      };
    }),

  // Получение списка супер-админов (только для главного superAdmin)
  listSuperAdmins: protectedProcedure.query(async ({ ctx }) => {
    // Проверяем, что пользователь - superAdmin
    if (!ctx.user?.isSuperAdmin) {
      throw new Error("Only super admins can list super admins");
    }

    // Получаем информацию о текущем superAdmin
    const currentAdmin = await prisma.superAdmin.findUnique({
      where: { id: ctx.user.id },
    });

    // Проверяем, что текущий superAdmin является главным
    if (!currentAdmin?.isMainAdmin) {
      throw new Error("Only main super admin can list super admins");
    }

    return await prisma.superAdmin.findMany({
      select: {
        id: true,
        login: true,
        name: true,
        isMainAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ isMainAdmin: "desc" }, { createdAt: "asc" }],
    });
  }),

  // Создание нового супер-админа (только для главного superAdmin)
  createSuperAdminByMain: protectedProcedure
    .input(
      z.object({
        login: z.string().min(3),
        password: z.string().min(8),
        name: z.string().optional(),
        isMainAdmin: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Проверяем, что пользователь - superAdmin
      if (!ctx.user?.isSuperAdmin) {
        throw new Error("Only super admins can create super admins");
      }

      // Получаем информацию о текущем superAdmin
      const currentAdmin = await prisma.superAdmin.findUnique({
        where: { id: ctx.user.id },
      });

      // Проверяем, что текущий superAdmin является главным
      if (!currentAdmin?.isMainAdmin) {
        throw new Error("Only main super admin can create super admins");
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const admin = await prisma.superAdmin.create({
        data: {
          login: input.login,
          password: hashedPassword,
          name: input.name,
          isMainAdmin: input.isMainAdmin,
        },
      });

      return {
        id: admin.id,
        login: admin.login,
        name: admin.name,
        isMainAdmin: admin.isMainAdmin,
      };
    }),

  // Обновление супер-админа (только для главного superAdmin)
  updateSuperAdmin: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        login: z.string().min(3).optional(),
        name: z.string().optional(),
        password: z.string().min(8).optional(),
        isMainAdmin: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Проверяем, что пользователь - superAdmin
      if (!ctx.user?.isSuperAdmin) {
        throw new Error("Only super admins can update super admins");
      }

      // Получаем информацию о текущем superAdmin
      const currentAdmin = await prisma.superAdmin.findUnique({
        where: { id: ctx.user.id },
      });

      // Проверяем, что текущий superAdmin является главным
      if (!currentAdmin?.isMainAdmin) {
        throw new Error("Only main super admin can update super admins");
      }

      // Запрещаем superAdmin изменять свой статус isMainAdmin
      if (input.id === ctx.user.id && input.isMainAdmin === false) {
        throw new Error("Cannot remove main admin status from yourself");
      }

      const updateData: any = {};

      if (input.name !== undefined) updateData.name = input.name;
      if (input.login) updateData.login = input.login;
      if (input.isMainAdmin !== undefined)
        updateData.isMainAdmin = input.isMainAdmin;
      if (input.password) {
        updateData.password = await bcrypt.hash(input.password, 10);
      }

      const admin = await prisma.superAdmin.update({
        where: { id: input.id },
        data: updateData,
      });

      return {
        id: admin.id,
        login: admin.login,
        name: admin.name,
        isMainAdmin: admin.isMainAdmin,
      };
    }),

  // Удаление супер-админа (только для главного superAdmin)
  deleteSuperAdmin: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Проверяем, что пользователь - superAdmin
      if (!ctx.user?.isSuperAdmin) {
        throw new Error("Only super admins can delete super admins");
      }

      // Получаем информацию о текущем superAdmin
      const currentAdmin = await prisma.superAdmin.findUnique({
        where: { id: ctx.user.id },
      });

      // Проверяем, что текущий superAdmin является главным
      if (!currentAdmin?.isMainAdmin) {
        throw new Error("Only main super admin can delete super admins");
      }

      // Запрещаем superAdmin удалять самого себя
      if (input.id === ctx.user.id) {
        throw new Error("Cannot delete yourself");
      }

      await prisma.superAdmin.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Вход в систему для всех типов пользователей
  login: publicProcedure
    .input(
      z.object({
        login: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      console.log("🔑 LOGIN ATTEMPT for:", input.login);

      // Пробуем найти супер-админа
      const superAdmin = await prisma.superAdmin.findUnique({
        where: { login: input.login },
      });

      if (superAdmin) {
        const passwordMatch = await bcrypt.compare(
          input.password,
          superAdmin.password,
        );
        if (!passwordMatch) {
          throw new Error("Invalid credentials");
        }

        // Записываем вход в историю
        try {
          await prisma.loginHistory.create({
            data: {
              userId: superAdmin.id,
              login: superAdmin.login,
              name: superAdmin.name,
              userType: "superAdmin",
              isMainAdmin: superAdmin.isMainAdmin,
            },
          });
          console.log(
            "✅ Login history recorded for superAdmin:",
            superAdmin.login,
          );
        } catch (error) {
          console.error(
            "❌ Error recording login history for superAdmin:",
            error,
          );
        }

        const token = generateToken({
          id: superAdmin.id,
          login: superAdmin.login,
          isSuperAdmin: true,
          isMainAdmin: superAdmin.isMainAdmin,
        });

        return {
          token,
          user: {
            id: superAdmin.id,
            login: superAdmin.login,
            name: superAdmin.name,
            isSuperAdmin: true,
            isMainAdmin: superAdmin.isMainAdmin,
          },
        };
      }

      // Если не супер-админ, ищем обычного пользователя
      const user = await prisma.user.findUnique({
        where: { login: input.login },
      });

      if (!user) {
        throw new Error("Invalid credentials");
      }

      const passwordMatch = await bcrypt.compare(input.password, user.password);
      if (!passwordMatch) {
        throw new Error("Invalid credentials");
      }

      // Записываем вход в историю
      try {
        await prisma.loginHistory.create({
          data: {
            userId: user.id,
            login: user.login,
            name: user.name,
            userType: "user",
            isMainAdmin: false,
          },
        });
        console.log("✅ Login history recorded for user:", user.login);
      } catch (error) {
        console.error("❌ Error recording login history for user:", error);
      }

      const token = generateToken({
        id: user.id,
        login: user.login,
        roles: user.roles, // Теперь передаем массив ролей
        isSuperAdmin: false,
      });

      return {
        token,
        user: {
          id: user.id,
          login: user.login,
          name: user.name,
          roles: user.roles, // Возвращаем массив ролей
          isSuperAdmin: false,
        },
      };
    }),

  // Создание пользователя с несколькими ролями
  createUser: protectedProcedure
    .input(
      z.object({
        login: z.string().min(3),
        password: z.string().min(8),
        name: z.string().optional(),
        roles: Roles, // Принимаем массив ролей
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Проверка прав (только супер-админ)
      if (!ctx.user?.isSuperAdmin) {
        throw new Error("Only super admins can create users");
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const user = await prisma.user.create({
        data: {
          login: input.login,
          password: hashedPassword,
          name: input.name,
          roles: input.roles, // Сохраняем массив ролей
        },
      });

      return {
        id: user.id,
        login: user.login,
        name: user.name,
        roles: user.roles,
      };
    }),

  // Обновление пользователя с несколькими ролями
  updateUser: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        login: z.string().min(3).optional(),
        name: z.string().optional(),
        roles: Roles.optional(), // Опциональный массив ролей
        password: z.string().min(8).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Проверка прав (только супер-админ)
      if (!ctx.user?.isSuperAdmin) {
        throw new Error("Only super admins can update users");
      }

      const updateData: any = {
        name: input.name,
      };

      if (input.roles) updateData.roles = input.roles;
      if (input.login) updateData.login = input.login;
      if (input.password) {
        updateData.password = await bcrypt.hash(input.password, 10);
      }

      const user = await prisma.user.update({
        where: { id: input.id },
        data: updateData,
      });

      return {
        id: user.id,
        login: user.login,
        name: user.name,
        roles: user.roles,
      };
    }),

  // Удаление пользователя (только для супер-админа)
  deleteUser: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.isSuperAdmin) {
        throw new Error("Only super admins can delete users");
      }

      await prisma.user.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Получение списка пользователей (только для супер-админа)
  listUsers: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.isSuperAdmin) {
      throw new Error("Only super admins can list users");
    }

    return await prisma.user.findMany({
      select: {
        id: true,
        login: true,
        name: true,
        roles: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }),

  // Получение информации о текущем пользователе
  getMe: protectedProcedure.query(({ ctx }) => {
    return {
      user: ctx.user,
    };
  }),

  // Получение истории входов (только для superAdmin)
  getLoginHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(1000).default(100),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Проверяем, что пользователь - superAdmin
      if (!ctx.user?.isSuperAdmin) {
        throw new Error("Only super admins can view login history");
      }

      const { limit, offset } = input;

      const [history, total] = await Promise.all([
        prisma.loginHistory.findMany({
          take: limit,
          skip: offset,
          orderBy: {
            loginTime: "desc",
          },
        }),
        prisma.loginHistory.count(),
      ]);

      return {
        history,
        total,
        limit,
        offset,
      };
    }),

  authWithToken: publicProcedure.query(async ({ ctx }) => {
    const token = ctx.req.headers.authorization?.split(" ")[1];

    try {
      // Проверяем и декодируем токен
      const decoded = verifyToken(token);

      // Для супер-админа
      if (decoded.isSuperAdmin) {
        const admin = await prisma.superAdmin.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            login: true,
            name: true,
            isMainAdmin: true,
          },
        });

        if (!admin) {
          throw new Error("Super admin not found");
        }
        const newToken = generateToken({
          id: admin.id,
          login: admin.login,
          isSuperAdmin: true,
          isMainAdmin: admin.isMainAdmin,
        });

        return {
          success: true,
          token: newToken,
          user: {
            ...admin,
            isSuperAdmin: true,
            isMainAdmin: admin.isMainAdmin,
          },
        };
      }

      // Для обычного пользователя
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          login: true,
          name: true,
          roles: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const newToken = generateToken({
        id: user.id,
        login: user.login,
        roles: user.roles,
        isSuperAdmin: false,
      });
      return {
        success: true,
        token: newToken,
        user: {
          ...user,
          isSuperAdmin: false,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: "Invalid or expired token",
      };
    }
  }),
});

export type AuthRouter = typeof authRouter;

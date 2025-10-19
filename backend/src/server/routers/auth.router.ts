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
      })
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
        },
      });

      return {
        id: admin.id,
        login: admin.login,
        name: admin.name,
      };
    }),

  // Вход в систему для всех типов пользователей
  login: publicProcedure
    .input(
      z.object({
        login: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Пробуем найти супер-админа
      const superAdmin = await prisma.superAdmin.findUnique({
        where: { login: input.login },
      });

      if (superAdmin) {
        const passwordMatch = await bcrypt.compare(
          input.password,
          superAdmin.password
        );
        if (!passwordMatch) {
          throw new Error("Invalid credentials");
        }

        const token = generateToken({
          id: superAdmin.id,
          login: superAdmin.login,
          isSuperAdmin: true,
        });

        return {
          token,
          user: {
            id: superAdmin.id,
            login: superAdmin.login,
            name: superAdmin.name,
            isSuperAdmin: true,
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
      })
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
      })
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
          },
        });

        if (!admin) {
          throw new Error("Super admin not found");
        }
        const newToken = generateToken({
          id: admin.id,
          login: admin.login,
          isSuperAdmin: true,
        });

        return {
          success: true,
          token: newToken,
          user: {
            ...admin,
            isSuperAdmin: true,
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
        isSuperAdmin: true,
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

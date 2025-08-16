// trpc/context.ts
import { inferAsyncReturnType } from "@trpc/server";
import { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { verifyToken } from "./utils/jwt";

export async function createContext({ req, res }: CreateFastifyContextOptions) {
  let user: any = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const payload = verifyToken(token);
      if (payload.isSuperAdmin) {
        user = {
          id: payload.id,
          login: payload.login,
          isSuperAdmin: true,
        };
      } else {
        user = {
          id: payload.id,
          login: payload.login,
          roles: payload.roles, // Теперь это массив
          isSuperAdmin: false,
        };
      }
    } catch (error) {
      console.error("Invalid token:", error);
    }
  }

  return { req, res, user };
}

export type Context = inferAsyncReturnType<typeof createContext>;

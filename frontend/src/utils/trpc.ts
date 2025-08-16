// src/utils/trpc.ts
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@malaka/backend/src/server/routers/_app'
import { httpBatchLink } from '@trpc/client'
import { QueryClient } from '@tanstack/react-query'
import { baseUrl } from '@/lib/api'

// Создаем экземпляр QueryClient для Tanstack Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 минут
    },
  },
})

// Создаем tRPC клиент
export const trpc = createTRPCReact<AppRouter>()

// Тип для нашего tRPC клиента
export type TRPCClient = typeof trpc

// Создаем tRPC клиент для использования в компонентах
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${baseUrl}/trpc`,
      // Опционально: добавление заголовков (например, для аутентификации)
      headers() {
        const token = localStorage.getItem('token')
        return token ? { Authorization: `Bearer ${token}` } : {}
      },
    }),
  ],
})

// Утилита для получения базового URL
export function getBaseUrl() {
  if (typeof window !== 'undefined') return '' // браузер должен использовать относительный URL
  return `http://localhost:5000` // локальная разработка
}

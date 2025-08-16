// src/utils/helpers.ts
/**
 * Возвращает базовый URL в зависимости от среды выполнения
 */
export function getBaseUrl() {
  if (typeof window !== 'undefined') return '' // браузер должен использовать относительный URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}` // SSR на Vercel
  return `http://localhost:${process.env.PORT ?? 3000}` // локальная разработка
}

/**
 * Форматирует дату в читаемый вид
 */
export function formatDate(dateString: string | Date) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Обрабатывает ошибки tRPC
 */
export function handleTRPCError(error: unknown) {
  // Здесь можно добавить логику обработки ошибок
  console.error('tRPC error:', error)
  return 'An error occurred'
}

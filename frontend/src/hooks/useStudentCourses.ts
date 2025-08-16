// src/hooks/useStudentCourses.ts
import { trpc } from '@/utils/trpc'

export function useStudentCourses(date: string) {
  // Получение курсов студентов по дате
  const {
    data: studentCoursesData,
    isLoading,
    refetch,
  } = trpc.studentCourse.getByDate.useQuery(
    { date },
    {
      enabled: true,
      refetchOnWindowFocus: false,
      throwOnError(_, query) {
        if (query.state.error?.data?.httpStatus === 401) {
          window.location.href = '/'
        }
        return false
      },
    },
  )

  // Мутация для массового обновления examResult
  const bulkUpdateExamResult =
    trpc.studentCourse.bulkUpdateExamResult.useMutation({})

  return {
    studentCourses: studentCoursesData?.studentCourses || [],
    prevDate: studentCoursesData?.prevDate || null,
    nextDate: studentCoursesData?.nextDate || null,
    isLoading,
    refetch,
    bulkUpdateExamResult,
  }
}

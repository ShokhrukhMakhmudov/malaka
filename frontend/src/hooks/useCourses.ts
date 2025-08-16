import { trpc } from '@/utils/trpc'

export function useCourses() {
  const utils = trpc.useUtils()

  // Получение всех курсов
  const { data: courses, isLoading } = trpc.course.getAll.useQuery(undefined, {
    throwOnError(_, query) {
      if (query.state.error?.data?.httpStatus === 401) {
        window.location.href = '/'
      }
      return false
    },
  })

  // Создание курса
  const createCourse = trpc.course.create.useMutation({
    onSuccess: () => {
      utils.course.invalidate()
    },
  })

  // Обновление курса
  const updateCourse = trpc.course.update.useMutation({
    onSuccess: () => {
      utils.course.invalidate()
    },
  })

  // Удаление курса
  const deleteCourse = trpc.course.delete.useMutation({
    onSuccess: () => {
      utils.course.invalidate()
    },
  })

  return {
    courses,
    isLoading,
    createCourse,
    updateCourse,
    deleteCourse,
  }
}

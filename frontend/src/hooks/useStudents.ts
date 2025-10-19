import { trpc } from '@/utils/trpc'

export function useStudents(options?: {
  search?: string
  department?: string
  courseId?: string
  date?: Date
}) {
  const { search, department, courseId, date } = options || {}

  const query: {
    search?: string
    department?: string
    courseId?: string
    date?: Date
  } = {
    search,
  }

  if (department) query.department = department
  if (courseId) query.courseId = courseId
  if (date) query.date = date

  // Получение студентов с возможностью поиска
  const {
    data: students,
    isLoading,
    refetch,
  } = trpc.student.getAll.useQuery(query, {
    enabled: true,
    refetchOnWindowFocus: false,
    throwOnError(_, query) {
      if (query.state.error?.data?.httpStatus === 401) {
        window.location.href = '/'
      }
      return false
    },
  })

  // Создание студента
  const createStudent = trpc.student.create.useMutation()

  // Обновление студента
  const updateStudent = trpc.student.update.useMutation()

  // Удаление студента
  const deleteStudent = trpc.student.delete.useMutation()

  // Импорт студентов
  const importStudents = trpc.student.import.useMutation()

  return {
    students,
    isLoading,
    refetch,
    createStudent,
    updateStudent,
    deleteStudent,
    importStudents,
  }
}

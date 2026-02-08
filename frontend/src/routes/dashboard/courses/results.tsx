import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { useStudentCourses } from '@/hooks/useStudentCourses'
import { toast } from 'sonner'
import { CircleCheckBig, XCircle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { trpc } from '@/utils/trpc'

export const Route = createFileRoute('/dashboard/courses/results')({
  component: CourseResultsPage,
})

function CourseResultsPage() {
  const [selectedDate, setSelectedDate] = useState<string>('') // Пустая строка = все даты
  const [examResults, setExamResults] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  // Получаем доступные даты
  const { data: availableDates = [] } =
    trpc.studentCourse.getAvailableDates.useQuery(undefined, {
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 0,
    })

  // Получаем данные курсов для выбранной даты (пустая строка = все данные)
  const { studentCourses, isLoading, bulkUpdateExamResult } =
    useStudentCourses(selectedDate)

  // Инициализация состояний чекбоксов
  useEffect(() => {
    if (studentCourses.length > 0) {
      const initialExamResults = studentCourses.reduce(
        (acc, course) => {
          acc[course.id] = course.examResult || false
          return acc
        },
        {} as Record<string, boolean>,
      )
      setExamResults(initialExamResults)
    } else {
      setExamResults({})
    }
  }, [isLoading])

  // Обновление отдельного значения
  const handleExamResultChange = (courseId: string, value: boolean) => {
    setExamResults((prev) => ({
      ...prev,
      [courseId]: value,
    }))
  }

  // Обновление всех значений
  const handleAllExamResultsChange = (value: boolean) => {
    const newExamResults = { ...examResults }
    Object.keys(newExamResults).forEach((courseId) => {
      newExamResults[courseId] = value
    })
    setExamResults(newExamResults)
  }

  // Отправка изменений
  const handleSubmit = async () => {
    setIsSubmitting(true)
    // Формируем массив изменений
    const changes = Object.entries(examResults).map(
      ([courseId, examResult]) => ({
        studentCourseId: courseId,
        examResult,
      }),
    )

    if (changes.length === 0) return

    try {
      await bulkUpdateExamResult.mutateAsync(changes)
      // После успешного обновления инвалидируем кэш
      queryClient.invalidateQueries()

      toast("Ma'lumotlar saqlandi!", {
        duration: 2000,
        position: 'top-center',
        icon: <CircleCheckBig className="text-green-500 w-7 h-7 pe-2" />,
        style: {
          width: 'fit-content',
          background: 'white',
          color: 'black',
          border: '3px solid #00c951',
          fontSize: '18px',
        },
      })
    } catch (error) {
      console.error('Ошибка при обновлении:', error)
      toast("Ma'lumotlarni yangilashda xatolik!", {
        duration: 2000,
        position: 'top-center',
        icon: <XCircle className="text-red-500 w-7 h-7 pe-2" />,
        style: {
          width: 'fit-content',
          background: 'white',
          color: 'black',
          border: '3px solid #fb2c36',
          fontSize: '18px',
        },
      })
    }
    setIsSubmitting(false)
  }

  // Проверяем, есть ли изменения
  const hasChanges =
    Object.keys(examResults).length > 0 &&
    Object.values(examResults).some((value) => value !== false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          {/* Заменяем кнопки навигации на Select */}
          <Select
            value={selectedDate}
            onValueChange={(value) =>
              value === 'all' ? setSelectedDate('') : setSelectedDate(value)
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sana tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha sanalar</SelectItem>
              {availableDates.map((date) => (
                <SelectItem key={date} value={date}>
                  {format(parseISO(date), 'dd.MM.yyyy')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!hasChanges || isSubmitting || !studentCourses.length}
        >
          {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
        </Button>
      </div>

      {/* Информация о выбранном фильтре */}
      {selectedDate ? (
        <div className="text-lg font-medium">
          Tanlangan sana: {format(parseISO(selectedDate), 'dd.MM.yyyy')}
        </div>
      ) : (
        <div className="text-lg font-medium">Barcha sanalar ko'rsatilmoqda</div>
      )}

      <div className="rounded-md border">
        <Table className="text-lg">
          <TableHeader>
            <TableRow>
              <TableHead>F.I.O</TableHead>
              <TableHead>Kurs</TableHead>
              <TableHead>Sana</TableHead>
              <TableHead className="text-center">
                Imtihon natijasi <br />
                <Checkbox
                  disabled={isSubmitting || !studentCourses.length}
                  checked={
                    studentCourses.length > 0 &&
                    Object.keys(examResults).length > 0 &&
                    Object.values(examResults).every((value) => value === true)
                  }
                  onCheckedChange={(value) =>
                    handleAllExamResultsChange(!!value)
                  }
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-6" />
                  </TableCell>
                </TableRow>
              ))
            ) : studentCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  {selectedDate
                    ? "Tanlangan sana uchun ma'lumot topilmadi"
                    : "Hech qanday ma'lumot topilmadi"}
                </TableCell>
              </TableRow>
            ) : (
              studentCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>{course.student.fullName}</TableCell>
                  <TableCell>{course.course.name}</TableCell>
                  <TableCell>
                    {format(parseISO(course.createdAt), 'dd.MM.yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      disabled={isSubmitting}
                      checked={examResults[course.id] || false}
                      onCheckedChange={(checked) =>
                        handleExamResultChange(course.id, !!checked)
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

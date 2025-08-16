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

export const Route = createFileRoute('/dashboard/courses/results')({
  component: CourseResultsPage,
})

function CourseResultsPage() {
  const [currentDate, setCurrentDate] = useState<string>(() => {
    const today = new Date()
    return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`
  })
  const [examResults, setExamResults] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const {
    studentCourses,
    prevDate,
    nextDate,
    isLoading,
    bulkUpdateExamResult,
  } = useStudentCourses(currentDate)

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
  }, [studentCourses])

  // Обработчики пагинации
  const goToPrevDate = () => {
    if (!prevDate) return
    setCurrentDate(prevDate)
  }

  const goToNextDate = () => {
    if (!nextDate) return
    setCurrentDate(nextDate)
  }

  // Обновление отдельного значения
  const handleExamResultChange = (courseId: string, value: boolean) => {
    setExamResults((prev) => ({
      ...prev,
      [courseId]: value,
    }))
  }
  // Обновление всех значения
  const handleAllExamResultsChange = (value: boolean) => {
    for (const exam in examResults) {
      handleExamResultChange(exam, value)
    }
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
  const hasChanges = Object.keys(examResults).length > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={goToPrevDate}
            disabled={!prevDate || isLoading}
          >
            Oldingisi
          </Button>
          <div className="text-lg font-medium">
            {currentDate
              ? format(parseISO(currentDate), 'dd.MM.yyyy')
              : 'Загрузка...'}
          </div>
          <Button
            variant="outline"
            onClick={goToNextDate}
            disabled={!nextDate || isLoading}
          >
            Keyingisi
          </Button>
        </div>

        <Button onClick={handleSubmit} disabled={!hasChanges || isSubmitting}>
          {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
        </Button>
      </div>

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
                  disabled={isSubmitting}
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
                  Нет данных на выбранную дату
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

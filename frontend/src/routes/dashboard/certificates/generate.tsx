import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { format, parseISO } from 'date-fns'
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
import { Check, CircleCheckBig, X, XCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { baseUrl } from '@/lib/api'
import type { CheckedState } from '@radix-ui/react-checkbox'

export const Route = createFileRoute('/dashboard/certificates/generate')({
  component: GenerateCertificatesPage,
})

function GenerateCertificatesPage() {
  const [currentDate, setCurrentDate] = useState<string>(() => {
    const today = new Date()
    return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`
  })
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [isGenerating, setIsGenerating] = useState(false)
  // const [generatingStatus, setGeneratingStatus] = useState<{
  //   [key: string]: {
  //     message: string
  //     status: 'pending' | 'success' | 'error'
  //   }
  // }>({})
  const [message, setMessage] = useState(
    '2025-yilning 4-avgust kunidan 19-avgust kuniga qadar \n Ichki ishlar vazirligi Malaka oshirish institutida',
  )
  const [additionalMessage, setAdditionalMessage] = useState('')
  const [date, setDate] = useState<string>(
    () => new Date().toISOString().split('T')[0],
  )

  const { studentCourses, prevDate, nextDate, isLoading, refetch } =
    useStudentCourses(currentDate)

  // Обработчики пагинации
  const goToPrevDate = () => {
    if (!prevDate) return
    setCurrentDate(prevDate)
    setSelectedCourses([]) // Сброс выбора при смене даты
  }

  const goToNextDate = () => {
    if (!nextDate) return
    setCurrentDate(nextDate)
    setSelectedCourses([]) // Сброс выбора при смене даты
  }

  // Выбор/снятие отдельного курса
  const toggleSelectCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    )
  }

  // Выбор/снятие всех курсов на странице
  const toggleSelectAll = (state: CheckedState) => {
    if (state) {
      setSelectedCourses(
        studentCourses
          .filter((course) => course.examResult)
          .map((course) => course.id),
      )
    } else {
      setSelectedCourses([])
    }
  }

  // Открытие диалога и подготовка к генерации
  const handleGenerateClick = () => {
    if (selectedCourses.length === 0) {
      toast('Hech qanday kurs tanlanmagan!', {
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
      return
    }
    setIsDialogOpen(true)
  }

  // Подтверждение генерации сертификатов

  const handleConfirmGenerate = async () => {
    if (selectedCourses.length === 0) return

    setIsGenerating(true)
    const errors: string[] = []
    const successes: string[] = []

    try {
      for (const courseId of selectedCourses) {
        // setGeneratingStatus((prev) => {
        //   prev[courseId] = {
        //     message: `Sertifikat yaratilmoqda...`,
        //     status: 'pending',
        //   }
        //   return { ...prev }
        // })
        try {
          const response = await fetch(baseUrl + '/certificate/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              studentCourseId: courseId,
              message,
              additionalMessage,
              date,
            }),
          })

          const data = await response.json()

          if (response.ok && data.success) {
            successes.push(courseId)
            // setGeneratingStatus((prev) => {
            //   prev[courseId] = {
            //     message: 'Sertifikat muvaffaqiyatli yaratildi',
            //     status: 'success',
            //   }
            //   return { ...prev }
            // })
          } else {
            errors.push(
              `${getStudentName(courseId)}: ${data.message || "Noma'lum xatolik"}`,
            )
            // setGeneratingStatus((prev) => {
            //   prev[courseId] = {
            //     message: 'Xatolik yuz berdi',
            //     status: 'error',
            //   }
            //   return { ...prev }
            // })
          }
        } catch (error) {
          errors.push(`${getStudentName(courseId)}: Xatolik yuz berdi`)
        }
      }

      if (successes.length > 0) {
        toast(`${successes.length} ta sertifikat muvaffaqiyatli yaratildi!`, {
          duration: 5000,
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
      }

      if (errors.length > 0) {
        toast(`${errors.length} ta sertifikat yaratilmadi:`, {
          duration: 10000,
          position: 'top-center',
          icon: <XCircle className="text-red-500 w-7 h-7 pe-2" />,
          style: {
            width: 'fit-content',
            background: 'white',
            color: 'black',
            border: '3px solid #fb2c36',
            fontSize: '18px',
          },
          description: (
            <ul className="list-disc pl-5 mt-2">
              {errors.map((error, i) => (
                <li key={i} className="text-sm">
                  {error}
                </li>
              ))}
            </ul>
          ),
        })
      }
    } finally {
      setIsGenerating(false)
      setSelectedCourses([])
      setIsDialogOpen(false)
      refetch()
      // Здесь можно добавить обновление данных
    }
  }

  // Получение имени студента по ID курса
  const getStudentName = (courseId: string) => {
    const course = studentCourses.find((sc) => sc.id === courseId)
    return course?.student.fullName || "Noma'lum"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={goToPrevDate}
            disabled={!prevDate || isLoading}
          >
            Ortga
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
            Oldiga
          </Button>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleGenerateClick}
              disabled={selectedCourses.length === 0}
            >
              Sertifikat yaratish
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Sertifikat yaratish</DialogTitle>
              <DialogDescription>
                Quyidagi kurslar uchun sertifikatlar yaratiladi:
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Xabar matni
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Qo'shimcha matn
                  </label>
                  <textarea
                    value={additionalMessage}
                    onChange={(e) => setAdditionalMessage(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Sana</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto py-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>F.I.O</TableHead>
                      <TableHead>Kurs</TableHead>
                      <TableHead>Sana</TableHead>
                      <TableHead>Sertifikat raqami</TableHead>
                      {/* <TableHead>Status</TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentCourses
                      .filter((course) => selectedCourses.includes(course.id))
                      .map((course) => (
                        <TableRow key={course.id}>
                          <TableCell>{course.student.fullName}</TableCell>
                          <TableCell>{course.course.name}</TableCell>
                          <TableCell>
                            {format(parseISO(course.createdAt), 'dd.MM.yyyy')}
                          </TableCell>
                          <TableCell>
                            {course.certificateNumber || 'Yaratiladi...'}
                          </TableCell>
                          {/* <TableHead>
                            {generatingStatus[course.courseId]?.status ===
                            'success' ? (
                              <CheckCircle className="text-green-500 w-7 h-7 pe-2" />
                            ) : generatingStatus[course.courseId]?.status ===
                              'error' ? (
                              <X className="text-red-500 w-7 h-7 pe-2" />
                            ) : generatingStatus[course.courseId]?.status ===
                              'pending' ? (
                              <Loader className="text-gray-500 w-7 h-7 pe-2 animate-spin" />
                            ) : (
                              <Clock className="text-gray-500 w-7 h-7 pe-2" />
                            )}
                          </TableHead> */}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isGenerating}
              >
                Bekor qilish
              </Button>
              <Button onClick={handleConfirmGenerate} disabled={isGenerating}>
                {isGenerating ? 'Yaratilmoqda...' : 'Tasdiqlash'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table className="text-lg">
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={
                      studentCourses.length > 0 &&
                      selectedCourses.length ===
                        studentCourses.filter((course) => course.examResult)
                          .length
                    }
                    onCheckedChange={toggleSelectAll}
                    disabled={isLoading || studentCourses.length === 0}
                  />
                </div>
              </TableHead>
              <TableHead>F.I.O</TableHead>
              <TableHead>Kurs</TableHead>
              <TableHead>Sana</TableHead>
              <TableHead>Imtihon</TableHead>
              <TableHead>Sertifikat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-6" />
                  </TableCell>
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
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                </TableRow>
              ))
            ) : studentCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Hech qanday ma'lumot topilmadi
                </TableCell>
              </TableRow>
            ) : (
              studentCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <Checkbox
                      checked={
                        course.examResult && selectedCourses.includes(course.id)
                      }
                      disabled={!course.examResult}
                      onCheckedChange={() => toggleSelectCourse(course.id)}
                    />
                  </TableCell>
                  <TableCell>{course.student.fullName}</TableCell>
                  <TableCell>
                    {course.course.name} ({course.course.prefix})
                  </TableCell>
                  <TableCell>
                    {format(parseISO(course.createdAt), 'dd.MM.yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal text-lg">
                      {course.examResult ? (
                        <Check
                          style={{
                            width: '20px',
                            height: '20px',
                          }}
                          className="ml-1 text-green-500"
                        />
                      ) : (
                        <X
                          style={{
                            width: '20px',
                            height: '20px',
                          }}
                          className="ml-1 text-red-500"
                        />
                      )}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {course.certificateNumber ? (
                      <a
                        href={course.certificateUrl as string}
                        target="_blank"
                        className="text-green-600 underline"
                      >
                        {course.certificateNumber}
                      </a>
                    ) : (
                      <span className="text-yellow-600">Sertifikat yo'q</span>
                    )}
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

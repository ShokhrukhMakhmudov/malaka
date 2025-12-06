import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useStudents } from '@/hooks/useStudents'
import CreateStudentDialog from './CreateStudentDialog'
import EditStudentDialog from './EditStudentDialog.tsx'
import DeleteStudentDialog from './DeleteStudentDialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Check,
  DownloadIcon,
  Loader,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Badge } from '../ui/badge.tsx'
import ImportStudentsDialog from './ImportStudentsDialog.tsx'
import { Button } from '../ui/button.tsx'
import { Link } from '@tanstack/react-router'
import { authStore } from '@/stores/auth.store.ts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select.tsx'
import { regions } from '@/utils/data.ts'
import { useCourses } from '@/hooks/useCourses.ts'
import { trpc } from '@/utils/trpc.ts'

export default function StudentList() {
  const [search, setSearch] = useState('')
  const [courseId, setCourseId] = useState('')
  const [department, setDepartment] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const { courses } = useCourses()
  const { students, availableDates, isLoading, refetch } = useStudents({
    search,
    courseId,
    department,
    date: selectedDate,
  })
  const isAdmin = authStore.state.user?.isSuperAdmin

  const generateStudentList = trpc.reports.generateStudentList.useMutation()

  // Пагинация
  const paginatedStudents = useMemo(() => {
    if (!students) return []
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return students.slice(startIndex, endIndex)
  }, [students, currentPage])

  const totalPages = Math.ceil((students?.length || 0) / itemsPerPage)

  // Сброс пагинации при изменении фильтров
  const handleFilterChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string,
  ) => {
    setter(value)
    setCurrentPage(1) // Сбрасываем на первую страницу при изменении фильтра
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  // Навигация по страницам
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const goToFirstPage = () => goToPage(1)
  const goToLastPage = () => goToPage(totalPages)
  const goToPreviousPage = () => goToPage(currentPage - 1)
  const goToNextPage = () => goToPage(currentPage + 1)

  const exportToExcel = async () => {
    setIsExporting(true)
    try {
      if (!students || students.length === 0) {
        alert("Ma'lumotlar topilmadi!")
        return
      }

      // Отправляем студентов на бэк для генерации Excel
      const base64Data = await generateStudentList.mutateAsync({
        students,
      })

      // Декодируем base64 в бинарные данные
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // Создаём Blob из бинарных данных
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      // Создаём URL и инициируем загрузку
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url

      const now = new Date()
      const dateStr = `${now.getFullYear()}-${String(
        now.getMonth() + 1,
      ).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

      a.download = `tinglovchilar-royxati-${dateStr}.xlsx`
      document.body.appendChild(a)
      a.click()

      // Освобождаем URL
      window.URL.revokeObjectURL(url)
      setIsExporting(false)
    } catch (error) {
      console.error('Error exporting Excel:', error)
      alert("Xatolik yuz berdi: faylni eksport qilib bo'lmadi")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full sm:w-auto">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Qidirish..."
              value={search}
              size={isAdmin ? 20 : 48}
              onChange={(e) => handleSearchChange(e.target.value)}
            />

            <Select
              value={courseId}
              onValueChange={(value) =>
                handleFilterChange(setCourseId, value === 'all' ? '' : value)
              }
              required
            >
              <SelectTrigger size="lg" className="text-lg">
                <SelectValue placeholder="Kursni tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-lg" key={'all'} value={'all'}>
                  Barchasi
                </SelectItem>
                {courses &&
                  courses.map((course) => (
                    <SelectItem
                      className="text-lg"
                      key={course.id}
                      value={course.id}
                    >
                      {course.name} ({course.prefix})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select
              value={department}
              onValueChange={(value) =>
                handleFilterChange(setDepartment, value === 'all' ? '' : value)
              }
              required
            >
              <SelectTrigger size="lg" className="text-lg">
                <SelectValue placeholder="Bo'linmani tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-lg" key={'all'} value={'all'}>
                  Barchasi
                </SelectItem>
                {regions.map((item) => (
                  <SelectItem className="text-lg" key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Фильтр по дате */}
            <Select
              value={selectedDate}
              onValueChange={(value) =>
                handleFilterChange(
                  setSelectedDate,
                  value === 'all' ? '' : value,
                )
              }
            >
              <SelectTrigger size="lg" className="text-lg">
                <SelectValue placeholder="Sana" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-lg" key={'all'} value={'all'}>
                  Barchasi
                </SelectItem>
                {availableDates.map((date) => (
                  <SelectItem className="text-lg" key={date} value={date}>
                    {date}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Пагинация - расположена под input поиска */}
          {!isLoading && students && students.length > 0 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Jami: {students.length} ta</span>
                <span>•</span>
                <span>
                  Ko'rsatilmoqda: {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, students.length)}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className="h-8 w-8 text-sm"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={exportToExcel}
                disabled={isExporting}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <Loader className="w-4 h-4" />
                    Yuklanmoqda...
                  </>
                ) : (
                  <>
                    <DownloadIcon className="w-4 h-4" />
                    Ro'yxatni yuklab olish
                  </>
                )}
              </button>
            </div>
            <ImportStudentsDialog
              onSuccess={refetch}
              className="flex items-center"
            />
            {/* <CreateStudentDialog onSuccess={refetch} /> */}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : students && students.length > 0 ? (
        <div className="rounded-md border">
          <Table className="text-lg">
            <TableHeader>
              <TableRow>
                <TableHead>№</TableHead>
                <TableHead>F.I.O</TableHead>
                <TableHead>Passport (JSHIR)</TableHead>
                <TableHead>Unvoni</TableHead>
                <TableHead className="flex items-center justify-center gap-2">
                  Kurs
                  {isAdmin && (
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Link to="/dashboard/courses/results">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      </Link>
                    </Button>
                  )}
                </TableHead>
                {isAdmin && <TableHead className="w-32">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.map((student, ind) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {(currentPage - 1) * itemsPerPage + ind + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {student.fullName}
                  </TableCell>
                  <TableCell>{student.passport}</TableCell>
                  <TableCell>{student.rank || '-'}</TableCell>
                  <TableCell className="flex justify-center">
                    {student.courses?.length > 0 ? (
                      <div className="space-y-2">
                        {student.courses.map((sc) => (
                          <div key={sc.id} className="flex items-start gap-2">
                            <Badge
                              variant="secondary"
                              className="font-normal text-lg"
                            >
                              {sc.course.name} ({sc.course.prefix})
                              {sc.examResult ? (
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

                            <div className="text-xs text-muted-foreground">
                              {sc.certificateNumber && (
                                <div>{sc.certificateNumber}</div>
                              )}
                              {sc.certificateUrl && (
                                <div>
                                  <a
                                    href={sc.certificateUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                  >
                                    Sertifikatni ko'rish
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-2">
                        <EditStudentDialog
                          student={{
                            ...student,
                            createdAt: new Date(student.createdAt),
                            updatedAt: new Date(student.updatedAt),
                          }}
                          onSuccess={refetch}
                        />
                        <DeleteStudentDialog
                          student={{
                            ...student,
                            createdAt: new Date(student.createdAt),
                            updatedAt: new Date(student.updatedAt),
                          }}
                          onSuccess={refetch}
                        />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-md">
          <p className="text-gray-500">Tinglovchilar topilmadi!</p>
          <div className="mt-4 flex justify-center gap-2">
            <ImportStudentsDialog onSuccess={refetch} />
            <CreateStudentDialog onSuccess={refetch} />
          </div>
        </div>
      )}
    </div>
  )
}

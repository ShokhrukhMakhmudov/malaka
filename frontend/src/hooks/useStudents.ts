import { trpc } from '@/utils/trpc'
import * as XLSX from 'xlsx'
export function useStudents(options?: {
  search?: string
  department?: string
  courseId?: string
  date?: string // Теперь строка в формате ДД.ММ.ГГГГ
}) {
  const { search, department, courseId, date } = options || {}

  const query: {
    search?: string
    department?: string
    courseId?: string
    date?: string
  } = {
    search,
  }

  if (department) query.department = department
  if (courseId) query.courseId = courseId
  if (date) query.date = date

  // Получение студентов с возможностью поиска
  const {
    data: students,
    isLoading: isLoadingStudents,
    refetch,
  } = trpc.student.getAll.useQuery(query, {
    enabled: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    throwOnError(_, query) {
      if (query.state.error?.data?.httpStatus === 401) {
        window.location.href = '/'
      }
      return false
    },
  })

  // Получение доступных дат для фильтра
  const { data: availableDates = [], isLoading: isLoadingDates } =
    trpc.student.getAvailableDates.useQuery(
      {
        department,
        courseId,
      },
      {
        enabled: true,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        staleTime: 0,
      },
    )

  // Создание студента
  const createStudent = trpc.student.create.useMutation()

  // Обновление студента
  const updateStudent = trpc.student.update.useMutation()

  // Удаление студента
  const deleteStudent = trpc.student.delete.useMutation()

  // Импорт студентов
  const importStudents = trpc.student.import.useMutation()

  // Экспорт в Excel
  const exportMutation = trpc.student.export.useMutation()

  const exportToExcel = async () => {
    try {
      const data = await exportMutation.mutateAsync({
        search,
        department,
        courseId,
        date,
      })

      const wb = XLSX.utils.book_new()
      const allData: any[] = []

      // === 1. Добавляем общий заголовок таблицы ===
      allData.push([
        'Qayd raqami',
        'Familya ism sharifi',
        'Passport (JSHIR)',
        'Maxsus unvoni',
        'Sertifikat raqami',
      ])

      // === 2. Добавляем данные по группам ===
      Object.entries(data).forEach(([dateKey, courses]) => {
        // фильтруем только тех, у кого есть сертификат
        const validCourses = courses.filter((sc: any) => sc.certificateNumber)
        if (!validCourses.length) return

        const courseName = validCourses[0]?.course?.name || 'Noma’lum kurs'

        // объединённая строка с курсом и датой
        allData.push([`${courseName} ${dateKey}`])

        // строки студентов
        validCourses.forEach((sc: any, index: number) => {
          allData.push([
            index + 1,
            sc.student.fullName,
            sc.student.passport,
            sc.student.rank,
            sc.certificateNumber,
          ])
        })

        // пустая строка между группами
        allData.push([])
      })

      // === 3. Создаём лист из массива ===
      const ws = XLSX.utils.aoa_to_sheet(allData)
      ws['!merges'] = ws['!merges'] || []

      // === 4. Объединяем и стилизуем заголовки курсов ===
      let currentRow = 1 // первая строка занята общим заголовком
      Object.entries(data).forEach(([_, courses]) => {
        const validCourses = courses.filter((sc: any) => sc.certificateNumber)
        if (!validCourses.length) return

        // объединяем 5 ячеек
        ws['!merges'] = ws['!merges'] || []
        ws['!merges'].push({
          s: { r: currentRow, c: 0 },
          e: { r: currentRow, c: 4 },
        })

        const cellRef = XLSX.utils.encode_cell({ r: currentRow, c: 0 })
        ws[cellRef] = ws[cellRef] || { t: 's', v: '' }
        ws[cellRef].s = {
          font: { bold: true, sz: 13 },
          alignment: { horizontal: 'center', vertical: 'center' },
        }

        currentRow += validCourses.length + 2 // +1 пустая строка
      })

      // === 5. Стили для первой строки (общего заголовка) ===
      for (let col = 0; col < 5; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
        ws[cellRef] = ws[cellRef] || { t: 's', v: '' }
        ws[cellRef].s = {
          font: { bold: true, sz: 12 },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { patternType: 'solid', fgColor: { rgb: 'FFFFEA00' } },
          border: {
            top: { style: 'thin', color: { rgb: 'FF000000' } },
            left: { style: 'thin', color: { rgb: 'FF000000' } },
            bottom: { style: 'thin', color: { rgb: 'FF000000' } },
            right: { style: 'thin', color: { rgb: 'FF000000' } },
          },
        }
      }

      // === 6. Настраиваем ширину колонок ===
      ws['!cols'] = [
        { wch: 12 },
        { wch: 35 },
        { wch: 20 },
        { wch: 18 },
        { wch: 15 },
      ]

      // === 7. Добавляем лист в книгу ===
      XLSX.utils.book_append_sheet(wb, ws, 'Sertifikatlar')

      // === 8. Генерируем файл с включёнными стилями ===
      const wbout = XLSX.write(wb, {
        bookType: 'xlsx',
        type: 'binary',
        cellStyles: true, // важно!
      })

      // === 9. Конвертация бинарных данных в Blob ===
      function s2ab(s: string) {
        const buf = new ArrayBuffer(s.length)
        const view = new Uint8Array(buf)
        for (let i = 0; i < s.length; ++i) view[i] = s.charCodeAt(i) & 0xff
        return buf
      }

      const blob = new Blob([s2ab(wbout)], {
        type: 'application/octet-stream',
      })

      // === 10. Сохраняем файл ===
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sertifikatlar_${
        new Date().toISOString().split('T')[0]
      }.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  return {
    students,
    availableDates,
    isLoading: isLoadingStudents || isLoadingDates,
    refetch,
    createStudent,
    updateStudent,
    deleteStudent,
    importStudents,
    exportToExcel,
    isExporting: exportMutation.isPending,
  }
}

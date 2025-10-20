import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Download, X, Loader2, CheckCircle, Loader, Clock } from 'lucide-react'
import { CircleCheckBig, XCircle } from 'lucide-react'
import { useCourses } from '@/hooks/useCourses'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import * as XLSX from 'xlsx'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { baseUrl } from '@/lib/api'
import { regions } from '@/utils/data'

export default function ImportStudentsDialog({
  onSuccess,
  className,
}: {
  onSuccess: () => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [courseId, setCourseId] = useState('')
  const [department, setDepartment] = useState('')
  const [step, setStep] = useState(1) // 1: Выбор файла, 2: Предпросмотр
  const [studentsData, setStudentsData] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(
    new Set(),
  )
  const [generatingStatus, setGeneratingStatus] = useState<{
    [key: string]: 'pending' | 'success' | 'error'
  }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [date, setDate] = useState<string>(
    () => new Date().toISOString().split('T')[0],
  )
  const [message, setMessage] = useState<string>(
    '2025-yilning 4-avgust kunidan 19-avgust kuniga qadar \n Ichki ishlar vazirligi Malaka oshirish institutida',
  )
  const [additionalMessage, setAdditionalMessage] = useState<string>('')

  const { courses } = useCourses()

  // Обработчик изменения файла
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
    }
  }

  // Чтение Excel файла
  const readExcelFile = async () => {
    if (!file) return

    setIsLoadingData(true)

    try {
      const data = await readFileAsBinary(file)
      const workbook = XLSX.read(data, { type: 'binary' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      // Проверка обязательных полей
      const validData = jsonData.filter((row: any) => row.fio && row.passport)

      if (validData.length === 0) {
        toast("Faylda tinglovchi ma'lumotlari topilmadi!", {
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

      setStudentsData(validData)

      // Выбираем всех студентов по умолчанию
      const allSelected = new Set(validData.map((_, index) => index))
      setSelectedStudents(allSelected)

      // Переходим к шагу предпросмотра
      setStep(2)
    } catch (error) {
      toast("Faylni o'qishda xatolik!", {
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
    } finally {
      setIsLoadingData(false)
    }
  }

  // Чтение файла как бинарные данные
  const readFileAsBinary = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string)
        } else {
          reject(new Error("Faylni o'qib bo'lmadi"))
        }
      }

      reader.onerror = () => {
        reject(new Error("Faylni o'qishda xatolik"))
      }

      reader.readAsBinaryString(file)
    })
  }

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !courseId || !department || selectedStudents.size === 0) return

    setIsSubmitting(true)

    try {
      // Формируем данные для отправки
      const sendData = {
        courseId,
        students: studentsData.map((student, index) => ({
          fullName: student.fio,
          passport: String(student.passport),
          rank: student.unvon,
          phone: student.phone,
          examResult: selectedStudents.has(index),
        })),
        department,
      }

      const response = await fetch('/api/students/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sendData),
      })

      const result = await response.json()

      if (response.ok) {
        toast(
          <div>
            <p>Import natijalari:</p>
            <ul className="mt-2">
              <li>Yangi tinglovchilar: {result.stats.created}</li>
              <li>Yangilangan tinglovchilar: {result.stats.updated}</li>
              <li>O'tkazib yuborilgan: {result.stats.skipped}</li>
              <li>Jami: {result.stats.total}</li>
            </ul>
          </div>,
          {
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
          },
        )
        setOpen(false)
        resetForm()
        onSuccess()
      } else {
        throw new Error(result.error || 'Failed to import students')
      }
    } catch (error: any) {
      toast('Tinglovchilarni import qilishda xatolik!', {
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
    } finally {
      setIsSubmitting(false)
    }
  }

  // Выбор/снятие всех студентов
  const toggleAllStudents = () => {
    if (selectedStudents.size === studentsData.length) {
      setSelectedStudents(new Set())
    } else {
      const allSelected = new Set(studentsData.map((_, index) => index))
      setSelectedStudents(allSelected)
    }
  }

  // Выбор/снятие конкретного студента
  const toggleStudent = (index: number) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedStudents(newSelected)
  }

  // Сброс выбранного файла
  const resetFile = () => {
    setFile(null)
    setStudentsData([])
    setSelectedStudents(new Set())
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Полный сброс формы
  const resetForm = () => {
    setFile(null)
    setStudentsData([])
    setSelectedStudents(new Set())
    setCourseId('')
    setStep(1)
    setIsLoadingData(false)
    setIsSubmitting(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Переход к следующему шагу с обработкой файла
  const goToNextStep = async () => {
    if (!file || !courseId) return
    await readExcelFile()
  }

  const handleSubmitWithCertificate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !courseId || selectedStudents.size === 0) return

    setIsSubmitting(true)

    try {
      // Формируем данные для отправки
      const sendDataForCertificates = {
        courseId,
        department,
        students: studentsData
          .filter((_, index) => selectedStudents.has(index))
          .map((student) => ({
            fullName: student.fio,
            passport: String(student.passport),
            rank: student.unvon,
            phone: student.phone,
            examResult: true,
          })),
      }

      if (studentsData.length !== selectedStudents.size) {
        const sendData = {
          courseId,
          department,
          students: studentsData
            .filter((_, index) => !selectedStudents.has(index))
            .map((student) => ({
              fullName: student.fio,
              passport: String(student.passport),
              rank: student.unvon,
              phone: student.phone,
              examResult: false,
            })),
        }

        const response = await fetch(baseUrl + '/api/students/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sendData),
        })

        const result = await response.json()

        if (response.ok) {
          toast(
            <div>
              <p>Import natijalari:</p>
              <ul className="mt-2">
                <li>Yangi tinglovchilar: {result.stats.created}</li>
                <li>Yangilangan tinglovchilar: {result.stats.updated}</li>
                <li>O'tkazib yuborilgan: {result.stats.skipped}</li>
                <li>Jami: {result.stats.total}</li>
              </ul>
            </div>,
            {
              duration: 5000,
              position: 'top-right',
              icon: <CircleCheckBig className="text-green-500 w-7 h-7 pe-2" />,
              style: {
                width: 'fit-content',
                background: 'white',
                color: 'black',
                border: '3px solid #00c951',
                fontSize: '18px',
              },
            },
          )
        } else {
          throw new Error(result.error || 'Failed to import students')
        }
      }
      const results = {
        success: 0,
        errors: 0,
      }
      for (const student of sendDataForCertificates.students) {
        setGeneratingStatus((prev) => ({
          ...prev,
          [student.passport]: 'pending',
        }))
        const req = await fetch(baseUrl + '/api/student', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student,
            courseId,
            certificateData: {
              message,
              date,
              additionalMessage,
            },
          }),
        })

        const res = await req.json()

        if (res.success) {
          setGeneratingStatus((prev) => ({
            ...prev,
            [student.passport]: 'success',
          }))
          results.success += 1
        } else {
          setGeneratingStatus((prev) => ({
            ...prev,
            [student.passport]: 'error',
          }))
          results.errors += 1
        }
      }

      toast(
        <div>
          <p>Import natijalari:</p>
          <ul className="mt-2">
            <li>Muvaffaqiyatli: {results.success}</li>
            <li>Xatolik: {results.errors}</li>
          </ul>
        </div>,
        {
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
        },
      )
      setOpen(false)
      resetForm()
      onSuccess()
    } catch (error: any) {
      toast('Tinglovchilarni import qilishda xatolik!', {
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
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm()
        setOpen(isOpen)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="0"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 mr-2"
          >
            <path
              d="M2.859 2.877l12.57-1.795a.5.5 0 01.571.494v20.848a.5.5 0 01-.57.494L2.858 21.123a1 1 0 01-.859-.99V3.867a1 1 0 01.859-.99zM4 4.735v14.53l10 1.429V3.306L4 4.735zM17 19h3V5h-3V3h4a1 1 0 011 1v16a1 1 0 01-1 1h-4v-2zm-6.8-7l2.8 4h-2.4L9 13.714 7.4 16H5l2.8-4L5 8h2.4L9 10.286 10.6 8H13l-2.8 4z"
              stroke="none"
            />
          </svg>
          Fayl yuklash
        </Button>
      </DialogTrigger>
      <DialogContent className="lg:max-w-5xl w-full">
        <DialogHeader>
          <DialogTitle>Tinglovchilar ro'yxatini yuklash</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                <div>
                  <div className="flex items-center gap-8 mb-4">
                    <div>
                      <Label className="mb-2">Kurs *</Label>
                      <Select
                        value={courseId}
                        onValueChange={(value) => setCourseId(value)}
                        disabled={isLoadingData}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kursni tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses &&
                            courses.map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.name} ({course.prefix})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="mb-2">Hududiy boʻlinma *</Label>
                      <Select
                        value={department}
                        onValueChange={(value) => setDepartment(value)}
                        disabled={isLoadingData}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Bo'linmani tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Label
                    htmlFor="file"
                    className="mb-2 flex flex-col gap-4 items-start"
                  >
                    <span>Excel fayl (XLSX) *</span>
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoadingData}
                      >
                        Fayl tanlash
                      </Button>
                      {file && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1/2 -right-10 transform -translate-y-1/2"
                          onClick={resetFile}
                          disabled={isLoadingData}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </Label>

                  <Input
                    className="hidden"
                    id="file"
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    disabled={isLoadingData}
                  />

                  {file && (
                    <div className="mt-3 mb-2 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm dark:text-primary-foreground">
                        Fayl: <strong>{file.name}</strong> (
                        {Math.round(file.size / 1024)} KB)
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <div className="flex items-start gap-3">
                    <Download className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">
                        Shablonni yuklab olish
                      </h4>
                      <p className="text-sm text-blue-600 mt-1">
                        Talablarga muvofiq fayl yaratish uchun shablondan
                        foydalaning.
                      </p>
                      <Button
                        variant="link"
                        className="text-blue-600 px-0 mt-2"
                      >
                        <a
                          href="/frontend/public/shablon.xlsx"
                          download={true}
                          target="_blank"
                        >
                          Excel shablonni yuklab olish
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={isLoadingData}
                  >
                    Bekor qilish
                  </Button>
                  <Button
                    type="button"
                    disabled={
                      !file || !courseId || !department || isLoadingData
                    }
                    onClick={goToNextStep}
                  >
                    {isLoadingData ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Fayl o'qilmoqda...
                      </>
                    ) : (
                      'Keyingisi'
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-800 p-4">
                  <h3 className="font-medium">
                    {file?.name} ({studentsData.length} ta tinglovchi)
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    Imtihon natijalari qoniqarli tinglovchilarni belgilab qo'yin{' '}
                    <Checkbox checked={true} />
                  </p>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedStudents.size === studentsData.length
                            }
                            onCheckedChange={toggleAllStudents}
                            aria-label="Hammasini tanlash"
                          />
                        </TableHead>
                        <TableHead>FIO</TableHead>
                        <TableHead>Passport</TableHead>
                        <TableHead>Unvoni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentsData.map((student, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Checkbox
                              checked={selectedStudents.has(index)}
                              onCheckedChange={() => toggleStudent(index)}
                              aria-label={`${student.fio} tanlash`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {student.fio}
                          </TableCell>
                          <TableCell>{student.passport}</TableCell>
                          <TableCell>{student.unvon || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm">
                  {selectedStudents.size} ta tinglovchi imtihondan o'tkan
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={isSubmitting}
                  >
                    Orqaga
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Import qilinmoqda...
                      </>
                    ) : (
                      "Qo'shish"
                    )}
                  </Button>
                  <Button onClick={() => setStep(3)}>
                    Sertifikat yaratish
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-4">
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Matn
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="w-full h-32 p-2 border rounded"
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
                    <label className="block text-sm font-medium mb-1">
                      Sana
                    </label>
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
                        <TableHead>Passport</TableHead>
                        <TableHead>Sana</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentsData
                        .filter((_, index) => selectedStudents.has(index))
                        .map((student, ind) => (
                          <TableRow key={ind}>
                            <TableCell>{student.fio}</TableCell>
                            <TableCell>{student.passport}</TableCell>
                            <TableCell>{student.unvon}</TableCell>

                            <TableHead>
                              {generatingStatus[student.passport] ===
                              'success' ? (
                                <CheckCircle className="text-green-500 w-7 h-7 pe-2" />
                              ) : generatingStatus[student.passport] ===
                                'error' ? (
                                <X className="text-red-500 w-7 h-7 pe-2" />
                              ) : generatingStatus[student.passport] ===
                                'pending' ? (
                                <Loader className="text-gray-500 w-7 h-7 pe-2 animate-spin" />
                              ) : (
                                <Clock className="text-gray-500 w-7 h-7 pe-2" />
                              )}
                            </TableHead>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm">
                    {selectedStudents.size} ta tinglovchi imtihondan o'tkan
                  </p>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={isSubmitting}
                    >
                      Orqaga
                    </Button>

                    <Button
                      onClick={handleSubmitWithCertificate}
                      disabled={isSubmitting}
                    >
                      Sertifikat yaratish
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

import { useState, useEffect } from 'react'
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
import { useStudents } from '@/hooks/useStudents'
import { useCourses } from '@/hooks/useCourses'
import { toast } from 'sonner'
import StudentCourseForm from './StudentCourseForm'
import { CircleCheckBig, XCircle } from 'lucide-react'
import type {
  Student,
  StudentCourse,
} from '@malaka/backend/src/generated/prisma/client'

export default function EditStudentDialog({
  student,
  onSuccess,
}: {
  student: Student
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState(student.fullName)
  const [passport, setPassport] = useState(student.passport)
  const [rank, setRank] = useState(student.rank || '')
  const [phone, setPhone] = useState(student.phone || '')
  const [studentCourses, setStudentCourses] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { updateStudent } = useStudents()
  const { courses } = useCourses()

  // Инициализация данных студента при открытии диалога
  useEffect(() => {
    if (open && student) {
      setFullName(student.fullName)
      setPassport(student.passport)
      setRank(student.rank || '')
      setPhone(student.phone || '')

      // Преобразование курсов студента в формат для формы
      setStudentCourses(
        (student as Student & { courses: StudentCourse[] }).courses.map(
          (sc: StudentCourse) => ({
            id: sc.id,
            courseId: sc.courseId,
            examResult: sc.examResult,
            certificateNumber: sc.certificateNumber || '',
            certificateUrl: sc.certificateUrl || '',
          }),
        ),
      )
    }
  }, [open, student])

  const addCourse = () => {
    setStudentCourses([
      ...studentCourses,
      {
        courseId: '',
        examResult: false,
        certificateNumber: '',
        certificateUrl: '',
      },
    ])
  }

  const updateCourse = (index: number, updatedCourse: any) => {
    const newCourses = [...studentCourses]
    newCourses[index] = updatedCourse
    setStudentCourses(newCourses)
  }

  const removeCourse = (index: number) => {
    if (studentCourses.length === 1) return
    const newCourses = [...studentCourses]
    newCourses.splice(index, 1)
    setStudentCourses(newCourses)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateStudent.mutateAsync({
        id: student.id,
        fullName,
        passport,
        rank: rank || '',
        phone: phone || '',
        courses: studentCourses,
      })

      toast('Tinglovchi muvaffaqiyatli yangilandi!', {
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

      setOpen(false)
      onSuccess()
    } catch (error) {
      toast('Tinglovchi yangilashda xatolik!', {
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
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
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>Tinglovchini tahrirlash</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName" className="mb-2">
                FIO *
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="F I O"
                required
              />
            </div>

            <div>
              <Label htmlFor="passport" className="mb-2">
                Passport *
              </Label>
              <Input
                id="passport"
                value={passport}
                onChange={(e) => setPassport(e.target.value)}
                placeholder="AB1234567"
                required
                disabled // Паспорт нельзя менять
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rank" className="mb-2">
                Unvoni
              </Label>
              <Input
                id="rank"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                placeholder="Kapitan"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="mb-2">
                Telefon raqami
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <Label>Kurslar</Label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addCourse}
              >
                Kurs qo'shish
              </Button>
            </div>

            {studentCourses.map((course, index) => (
              <StudentCourseForm
                key={index}
                courses={courses || []}
                studentCourse={course}
                onChange={(updated) => updateCourse(index, updated)}
                onRemove={() => removeCourse(index)}
              />
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Yangilanmoqda...' : 'Yangilash'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

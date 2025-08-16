// src/components/students/DeleteStudentDialog.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2 } from 'lucide-react'
import { useStudents } from '@/hooks/useStudents'
import { toast } from 'sonner'
import { CircleCheckBig, XCircle } from 'lucide-react'
import type { Student } from '@malaka/backend/src/generated/prisma/client'

export default function DeleteStudentDialog({
  student,
  onSuccess,
}: {
  student: Student
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { deleteStudent } = useStudents()

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      await deleteStudent.mutateAsync({ id: student.id })
      toast("Tinglovchi muvaffaqiyatli o'chirildi!", {
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
      toast("Tinglovchi o'chirishda xatolik!", {
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
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Tinglovchini o'chirishni tasdiqlaysizmi?
          </AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-bold text-red-600">{student.fullName}</span>{' '}
            <span className="">
              ismli studentni rostdan ham o'chirmoqchimisiz? Bu amalni ortga
              qaytarib bo'lmaydi.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Bekor qilish
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/80"
          >
            {isDeleting ? "O'chirilmoqda..." : "O'chirish"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

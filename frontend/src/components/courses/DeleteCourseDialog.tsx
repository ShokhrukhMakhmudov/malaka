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
import { CircleCheckBig, Trash2, XCircle } from 'lucide-react'
import { useCourses } from '@/hooks/useCourses'
import { toast } from 'sonner'

interface DeleteCourseDialogProps {
  course: {
    id: string
    name: string
    prefix: string
    createdAt: string
    updatedAt: string
  }
}

export default function DeleteCourseDialog({
  course,
}: DeleteCourseDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { deleteCourse } = useCourses()

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      await deleteCourse.mutateAsync({ id: course.id })
      toast("Kurs o'chirildi!", {
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
    } catch (error) {
      toast("Kurs o'chirishda xatolik!", {
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
          <AlertDialogTitle>Delete Course?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the course "{course.name}" (
            {course.prefix})? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/80"
          >
            {isDeleting ? 'Deleting...' : 'Delete Course'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

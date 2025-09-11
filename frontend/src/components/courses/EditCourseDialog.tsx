import { useState } from 'react'
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
import { useCourses } from '@/hooks/useCourses'
import { toast } from 'sonner'
import { CircleCheckBig, Pencil, XCircle } from 'lucide-react'

interface EditCourseDialogProps {
  course: {
    id: string
    name: string
    prefix: string
    createdAt: string
    updatedAt: string
  }
}
export default function EditCourseDialog({ course }: EditCourseDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(course.name)
  const [prefix, setPrefix] = useState(course.prefix)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateCourse } = useCourses()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateCourse.mutateAsync({ id: course.id, name, prefix })
      toast('Kurs muvaffaqiyatli yangilandi!', {
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
      toast('Kurs yangilashda xatolik!', {
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
        <Button variant="outline" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kursni tahrirlash</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="mb-2">
              Kurs nomi
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="prefix" className="mb-2">
              Prefix
            </Label>
            <Input
              id="prefix"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              maxLength={10}
              required
            />
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
              {isSubmitting ? 'Yangilanmoqda...' : 'Tahrirlash'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

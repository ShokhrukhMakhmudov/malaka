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
import { CircleCheckBig, XCircle } from 'lucide-react'

export default function CreateCourseDialog({
  className,
}: {
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [prefix, setPrefix] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createCourse } = useCourses()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await createCourse.mutateAsync({ name, prefix })

      toast('Kurs muvaffaqiyatli yaratildi!', {
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
      setName('')
      setPrefix('')
    } catch (error) {
      toast('Kurs yaratishda xatolik!', {
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
        <Button className={className}>Qo'shish</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kurs yaratish</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Label htmlFor="name" className="mb-2">
            Kurs nomi:
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Qayta tayyorlash"
            required
          />

          <Label htmlFor="prefix" className="mb-2">
            Prefix
          </Label>
          <Input
            id="prefix"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="QT"
            maxLength={10}
            required
            className="text-uppercase"
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setOpen(false)}
            >
              Bekoq qilish
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Yaratilmoqda...' : 'Yaratish'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

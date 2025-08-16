import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function StudentCourseForm({
  courses,
  studentCourse,
  onChange,
  onRemove,
}: {
  courses: any[]
  studentCourse: any
  onChange: (updated: any) => void
  onRemove: () => void
}) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...studentCourse, [field]: value })
  }

  return (
    <div className="border rounded-md p-4 mb-4 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>

      <div className="mb-4">
        <Label className="mb-2">Kurs *</Label>
        <Select
          value={studentCourse.courseId || ''}
          onValueChange={(value) => handleChange('courseId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Kursni tanlang" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.name} ({course.prefix})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-2">Sertifikat raqami</Label>
          <Input
            value={studentCourse.certificateNumber || ''}
            onChange={(e) => handleChange('certificateNumber', e.target.value)}
            placeholder="CT-12345"
            className="text-sm"
          />
        </div>

        <div>
          <Label className="mb-2">Sertifikat URL</Label>
          <Input
            value={studentCourse.certificateUrl || ''}
            onChange={(e) => handleChange('certificateUrl', e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="flex items-center mt-4">
        <Checkbox
          id={`exam-passed-${studentCourse.id}`}
          checked={studentCourse.examResult || false}
          onCheckedChange={(checked) => handleChange('examResult', checked)}
        />
        <Label htmlFor={`exam-passed-${studentCourse.id}`} className="ml-2">
          Imtihon natijasi ( Natija qoniqarli bo'lsa <Checkbox checked />)
        </Label>
      </div>
    </div>
  )
}

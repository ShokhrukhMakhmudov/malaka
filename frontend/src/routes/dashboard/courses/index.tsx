import { createFileRoute } from '@tanstack/react-router'
import CourseList from '@/components/courses/CourseList'

export const Route = createFileRoute('/dashboard/courses/')({
  component: CoursesPage,
})

function CoursesPage() {
  return (
    <div className="container ">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Kurslar ro'yxati</h1>
        </div>
        <CourseList />
      </div>
    </div>
  )
}

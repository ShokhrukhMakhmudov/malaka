import { createFileRoute } from '@tanstack/react-router'
import StudentList from '@/components/students/StudentList'

export const Route = createFileRoute('/dashboard/students')({
  component: StudentsPage,
})

function StudentsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Tinglovchilar ro'yxati</h1>
        </div>
        <StudentList />
      </div>
    </div>
  )
}

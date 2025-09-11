import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCourses } from '@/hooks/useCourses'
import CreateCourseDialog from './CreateCourseDialog'
import EditCourseDialog from './EditCourseDialog'
import DeleteCourseDialog from './DeleteCourseDialog'
import { Skeleton } from '@/components/ui/skeleton'

export default function CourseList() {
  const { courses, isLoading } = useCourses()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-9 rounded-md" />
                      <Skeleton className="h-9 w-9 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold"></h2>
        <CreateCourseDialog />
      </div>

      {courses && courses.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader className="text-lg">
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead className="w-32">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-lg">
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.name}</TableCell>
                  <TableCell>{course.prefix}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <EditCourseDialog course={course} />
                      <DeleteCourseDialog course={course} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-md">
          <p className="text-gray-500">Kurslar mavjud emas</p>
          <CreateCourseDialog className="mt-4" />
        </div>
      )}
    </div>
  )
}

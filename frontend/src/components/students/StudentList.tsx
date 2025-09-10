import { useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useStudents } from '@/hooks/useStudents'
import CreateStudentDialog from './CreateStudentDialog'
import EditStudentDialog from './EditStudentDialog.tsx'
import DeleteStudentDialog from './DeleteStudentDialog'
// import ImportStudentsDialog from './ImportStudentsDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, X } from 'lucide-react'
import { Badge } from '../ui/badge.tsx'
import ImportStudentsDialog from './ImportStudentsDialog.tsx'
import { Button } from '../ui/button.tsx'
import { Link } from '@tanstack/react-router'
import { authStore } from '@/stores/auth.store.ts'

export default function StudentList() {
  const [search, setSearch] = useState('')
  const { students, isLoading, refetch } = useStudents({ search })
  const isAdmin = authStore.state.user?.isSuperAdmin
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full sm:w-auto">
          <Input
            placeholder="Qidirish..."
            value={search}
            size={isAdmin ? 20 : 48}
            onChange={handleSearch}
          />
        </div>
        {isAdmin && (
          <div className="flex gap-2 w-full sm:w-auto">
            <ImportStudentsDialog
              onSuccess={refetch}
              className="flex items-center"
            />
            <CreateStudentDialog onSuccess={refetch} />
          </div>
        )}
      </div>

      {isLoading ? (
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
                <TableHead>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : students && students.length > 0 ? (
        <div className="rounded-md border">
          <Table className="text-lg">
            <TableHeader>
              <TableRow>
                <TableHead>F.I.O</TableHead>
                <TableHead>Passport (JSHIR)</TableHead>
                <TableHead>Unvoni</TableHead>
                {/* <TableHead>Telefon</TableHead> */}
                <TableHead className="flex items-center justify-center gap-2">
                  Kurs
                  {isAdmin && (
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Link to="/dashboard/courses/results">
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
                      </Link>
                    </Button>
                  )}
                </TableHead>
                {isAdmin && <TableHead className="w-32">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.fullName}
                  </TableCell>
                  <TableCell>{student.passport}</TableCell>
                  <TableCell>{student.rank || '-'}</TableCell>
                  {/* <TableCell>{student.phone || '-'}</TableCell> */}
                  <TableCell className="flex justify-center">
                    {student.courses?.length > 0 ? (
                      <div className="space-y-2">
                        {student.courses.map((sc) => (
                          <div key={sc.id} className="flex items-start gap-2">
                            <Badge
                              variant="secondary"
                              className="font-normal text-lg"
                            >
                              {sc.course.name} ({sc.course.prefix})
                              {sc.examResult ? (
                                <Check
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                  }}
                                  className="ml-1 text-green-500"
                                />
                              ) : (
                                <X
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                  }}
                                  className="ml-1 text-red-500"
                                />
                              )}
                            </Badge>

                            <div className="text-xs text-muted-foreground">
                              {sc.certificateNumber && (
                                <div>{sc.certificateNumber}</div>
                              )}
                              {sc.certificateUrl && (
                                <div>
                                  <a
                                    href={sc.certificateUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                  >
                                    Sertifikatni ko'rish
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-2">
                        <EditStudentDialog
                          student={{
                            ...student,
                            createdAt: new Date(student.createdAt),
                            updatedAt: new Date(student.updatedAt),
                          }}
                          onSuccess={refetch}
                        />
                        <DeleteStudentDialog
                          student={{
                            ...student,
                            createdAt: new Date(student.createdAt),
                            updatedAt: new Date(student.updatedAt),
                          }}
                          onSuccess={refetch}
                        />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-md">
          <p className="text-gray-500">Tinglovchilar topilmadi!</p>
          <div className="mt-4 flex justify-center gap-2">
            <ImportStudentsDialog onSuccess={refetch} />
            <CreateStudentDialog onSuccess={refetch} />
          </div>
        </div>
      )}
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '@/utils/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Users, BookOpen, CheckCircle } from 'lucide-react'
import DownloadReportButton from '@/components/DownloadReport'
// import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardPage,
})

export default function DashboardPage() {
  // Запросы данных
  const { data: studentCount, isLoading: isCountLoading } =
    trpc.dashboard.getStudentCount.useQuery()
  const { data: yearlyStatsData, isLoading: isYearlyStatsLoading } =
    trpc.dashboard.getCourseYearlyStats.useQuery()
  // const { data: recentStudents, isLoading: isRecentLoading } =
  //   trpc.dashboard.getRecentStudents.useQuery()
  const { data: examStats, isLoading: isExamLoading } =
    trpc.dashboard.getExamStats.useQuery()

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Statistika
        </h1>
        <DownloadReportButton />
      </div>

      {/* Карточки с ключевыми метриками */}
      <div className="grid grid-rows-1 lg:grid-cols-3 gap-4 mb-8">
        <Card className="gap-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Tinglovchilar soni
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-row items-center justify-between">
            {isCountLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-4xl font-bold">
                {studentCount?.totalStudents}
              </div>
            )}
            <Users className="h-8 w-8 text-gray-500" />
          </CardContent>
        </Card>

        <Card className="gap-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              O'quv kurslar soni
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-row items-center justify-between">
            {isCountLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-4xl font-bold">
                {studentCount?.totalCourses}
              </div>
            )}
            <BookOpen className="h-8 w-8 text-gray-500" />
          </CardContent>
        </Card>

        <Card className="gap-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Imtihon natijalari
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-row items-center justify-between">
            {isCountLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-4xl font-bold">
                <span className="text-green-500">
                  {studentCount?.passedExams}
                </span>
                <span>/</span>
                <span className="text-4xl font-bold">
                  {studentCount?.totalStudentsCourses}
                </span>
              </div>
            )}
            <CheckCircle className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
      </div>

      {/* График статистики по курсам */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Kurslar bo'yicha yillik statistika</CardTitle>
          </CardHeader>
          <CardContent>
            {isYearlyStatsLoading ? (
              <Skeleton className="h-96 w-full" />
            ) : yearlyStatsData && yearlyStatsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={yearlyStatsData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="courseName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {/* Группировка столбцов по году */}
                  <Bar
                    dataKey="previousYear.total"
                    name="O'tgan yil: Jami"
                    fill="#8884d8"
                  />
                  <Bar
                    dataKey="previousYear.passed"
                    name="O'tgan yil: O'tganlar"
                    fill="#82ca9d"
                  />
                  <Bar
                    dataKey="currentYear.total"
                    name="Joriy yil: Jami"
                    fill="#ffc658"
                  />
                  <Bar
                    dataKey="currentYear.passed"
                    name="Joriy yil: O'tganlar"
                    fill="#ff7300"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500">
                Ma'lumotlar mavjud emas
              </div>
            )}
          </CardContent>
        </Card>

        {/* Статистика экзаменов */}
        <Card>
          <CardHeader>
            <CardTitle>Imtihon natijalari</CardTitle>
          </CardHeader>
          <CardContent>
            {isExamLoading ? (
              <Skeleton className="h-96 w-full" />
            ) : examStats && examStats.length > 0 ? (
              <div className="space-y-4">
                {examStats.map((stat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{stat.courseName}</span>
                      <span>{stat.passRate}% </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-500 h-2.5 rounded-full"
                        style={{ width: `${stat.passRate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500">
                Нет данных для отображения
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Таблица последних студентов */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="text-xl">Yangi tinglovchilar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="text-xl">
            <TableHeader>
              <TableRow>
                <TableHead>F.I.O</TableHead>
                <TableHead>Kurs</TableHead>
                <TableHead>Sana</TableHead>
                <TableHead className="text-center">Imtihon natijasi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isRecentLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : recentStudents && recentStudents.length > 0 ? (
                recentStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.fullName}
                    </TableCell>
                    <TableCell>
                      {student.courses.map((sc) => (
                        <div key={sc.id} className="text-lg">
                          {sc.course.name} ({sc.course.prefix})
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>
                      {new Date(student.createdAt).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell className="text-center">
                      {student.courses.map((sc) => (
                        <Badge variant="secondary" className="font-normal">
                          {sc.examResult ? (
                            <Check
                              style={{ width: '24px', height: '24px' }}
                              className="ml-1 text-green-500"
                            />
                          ) : (
                            <X
                              style={{ width: '24px', height: '24px' }}
                              className="ml-1 text-red-500"
                            />
                          )}
                        </Badge>
                      ))}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    Нет данных
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card> */}
    </div>
  )
}

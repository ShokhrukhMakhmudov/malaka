import Header from '@/components/Header'
import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '@/utils/trpc'

export const Route = createFileRoute('/')({
  component: Home,
})

// Тип данных для курса
type CourseStats = {
  courseId: string
  courseName: string
  prefix: string
  totalStudents: number
  passedStudents: number
}

export default function Home() {
  // Загрузка данных статистики
  const studentCountQuery = trpc.dashboard.getStudentCount.useQuery()
  const courseStatsQuery = trpc.dashboard.getCourseStats.useQuery()

  // Расчет общей статистики
  const totalStudents = studentCountQuery.data?.totalStudents || 0
  const totalCourses = studentCountQuery.data?.totalCourses || 0
  const activeCourses = studentCountQuery.data?.activeCourses || 0
  const passedExams = studentCountQuery.data?.passedExams || 0

  // Расчет процента успешной сдачи экзаменов
  const passRate =
    totalStudents > 0 ? Math.round((passedExams / totalStudents) * 100) : 0

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-32">
        {/* Заголовок и логотип */}
        <div className="text-center mb-16">
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-56 h-56 mb-8">
              {/* <div className="absolute inset-0 bg-blue-600 rounded-full opacity-20 blur-xl animate-pulse"></div> */}
              <img
                src="/logo.png"
                className="w-full h-full object-contain"
                alt="Логотип Института"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
              ICHKI ISHLAR VAZIRLIGI MALAKA OSHIRISH INSTITUTI
            </h1>
          </div>
        </div>

        {/* Общая статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Tinglovchilar"
            value={totalStudents}
            icon={
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            }
            color="blue"
            loading={studentCountQuery.isLoading}
          />

          <StatCard
            title="Kurslar"
            value={totalCourses}
            icon={
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            }
            color="green"
            loading={studentCountQuery.isLoading}
          />

          <StatCard
            title="Faol kurslar"
            value={activeCourses}
            icon={
              <svg
                className="w-8 h-8 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            }
            color="purple"
            loading={studentCountQuery.isLoading}
          />

          <StatCard
            title="Imtihonar natijasi"
            value={`${passRate}%`}
            icon={
              <svg
                className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            color="yellow"
            loading={studentCountQuery.isLoading}
          />
        </div>

        {/* Заголовок статистики курсов */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
            Statistika
          </h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Faol kurslar soni:{' '}
            <span className="font-medium">{activeCourses}</span>
          </div>
        </div>

        {/* Карточки курсов */}
        {courseStatsQuery.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : courseStatsQuery.data && courseStatsQuery.data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courseStatsQuery.data.map((course) => (
              <CourseCard key={course.courseId} course={course} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-xl font-medium text-gray-800 dark:text-white mt-4">
              Данные о курсах отсутствуют
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Информация о курсах будет доступна после их создания
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Компонент карточки курса
const CourseCard = ({ course }: { course: Omit<CourseStats, 'prefix'> }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
              {course.courseName}
            </h3>
          </div>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {course.totalStudents} ta
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Imtihon natijasi
            </span>
            <span className="font-medium">
              {course.passedStudents} (
              {course.totalStudents > 0
                ? Math.round(
                    (course.passedStudents / course.totalStudents) * 100,
                  )
                : 0}
              %)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1 dark:bg-gray-700">
            <div
              className="bg-green-600 h-2 rounded-full"
              style={{
                width: `${
                  course.totalStudents > 0
                    ? Math.round(
                        (course.passedStudents / course.totalStudents) * 100,
                      )
                    : 0
                }%`,
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Компонент карточки статистики
const StatCard = ({
  title,
  value,
  icon,
  color,
  loading,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  loading: boolean
}) => {
  const colorClasses: {
    [key: string]: string
  } = {
    blue: 'border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20',
    green:
      'border-green-100 dark:border-green-900 bg-green-50 dark:bg-green-900/20',
    purple:
      'border-purple-100 dark:border-purple-900 bg-purple-50 dark:bg-purple-900/20',
    yellow:
      'border-yellow-100 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/20',
  }

  const iconClasses: {
    [key: string]: string
  } = {
    blue: 'bg-blue-100 dark:bg-blue-900',
    green: 'bg-green-100 dark:bg-green-900',
    purple: 'bg-purple-100 dark:bg-purple-900',
    yellow: 'bg-yellow-100 dark:bg-yellow-900',
  }

  return (
    <div className={`rounded-2xl shadow-lg p-6 border ${colorClasses[color]}`}>
      <div className="flex items-center">
        <div className={`p-3 rounded-lg mr-4 ${iconClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mt-1 animate-pulse"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              {value}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

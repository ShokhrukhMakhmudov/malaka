import { trpc } from '@/utils/trpc'

// Тип данных для курса
type CourseStats = {
  courseId: string
  courseName: string
  prefix: string
  totalStudents: number
  passedStudents: number
}
export default function Stats() {
  const courseStatsQuery = trpc.dashboard.getCourseStats.useQuery()
  return (
    <>
      {/* Карточки курсов */}
      {courseStatsQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg overflow-hidden p-6"
            >
              <div className="animate-pulse">
                <div className="h-6 bg-white/20 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-white/20 rounded w-1/4 mb-6"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-white/20 rounded w-full"></div>
                  <div className="h-2 bg-white/20 rounded w-full"></div>
                  <div className="h-4 bg-white/20 rounded w-1/2"></div>
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
        <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto text-white/50"
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
          <h3 className="text-xl font-medium text-white mt-4 drop-shadow-sm">
            Kurslar mavjud emas
          </h3>
          <p className="text-white/70 mt-2 drop-shadow-sm">
            Kurslar yaratilgandan so'ng ma'lumotlar paydo bo'ladi
          </p>
        </div>
      )}
    </>
  )
}

// Компонент карточки курса
const CourseCard = ({ course }: { course: Omit<CourseStats, 'prefix'> }) => {
  const passRate =
    course.totalStudents > 0
      ? Math.round((course.passedStudents / course.totalStudents) * 100)
      : 0

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-white/10">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-white drop-shadow-sm">
              {course.courseName}
            </h3>
          </div>
          <span className="bg-blue-400/20 text-white font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-sm">
            {course.totalStudents}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-white/80 drop-shadow-sm">
              Imtihon natijasi
            </span>
            <span className="font-medium text-white drop-shadow-sm">
              {passRate}%
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full"
              style={{ width: `${passRate}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-white/60">0%</span>
            <span className="text-xs text-white/60">100%</span>
          </div>
        </div>
      </div>

      <div className="px-6 pb-4 ">
        <div className="text-sm flex items-center justify-between border-white border-1 rounded-md py-1 px-2">
          <span className="text-white/70">Sertifikatga ega, bo'lganlar:</span>
          <span className="font-medium text-white text-lg">
            {course.passedStudents}
          </span>
        </div>
      </div>
    </div>
  )
}

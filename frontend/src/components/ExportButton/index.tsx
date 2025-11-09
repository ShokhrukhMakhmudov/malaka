import { useStudents } from '@/hooks/useStudents'
import { DownloadIcon, Loader } from 'lucide-react'

export function ExportButton() {
  const { exportToExcel, isExporting } = useStudents()

  return (
    <button
      onClick={exportToExcel}
      disabled={isExporting}
      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
    >
      {isExporting ? (
        <>
          <Loader size="small" />
          Yuklanmoqda...
        </>
      ) : (
        <>
          <DownloadIcon className="w-4 h-4" />
          Faylni yuklab olish
        </>
      )}
    </button>
  )
}

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { yearStore } from '@/stores/year.store'
import { trpc } from '@/utils/trpc'

export default function ExportFailedStudents() {
  const [year, setYear] = useState(yearStore.state)

  useEffect(() => {
    setYear(yearStore.state)
  }, [yearStore.state])

  const exportMutation = trpc.dashboard.exportFailedStudents.useMutation({
    onSuccess: (data) => {
      // Конвертируем base64 в blob
      const byteCharacters = atob(data.fileData)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: data.mimeType })

      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.fileName
      document.body.appendChild(a)
      a.click()

      // Очистка
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`${year} yil uchun hisobot yuklab olindi`)
    },
    onError: (error) => {
      console.error('Export error:', error)
      toast.error(error.message || 'Hisobotni yuklab olishda xatolik yuz berdi')
    },
  })

  const handleExport = () => {
    exportMutation.mutate({ year })
  }

  return (
    <Button
      onClick={handleExport}
      disabled={exportMutation.isPending}
      variant="outline"
      size="default"
      className="gap-2 bg-transparent"
    >
      {exportMutation.isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Yuklanmoqda...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Imtihon topshirmaganlar
        </>
      )}
    </Button>
  )
}

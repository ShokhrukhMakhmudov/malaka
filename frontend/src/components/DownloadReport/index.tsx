// src/components/DownloadReportButton.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { trpc } from '@/utils/trpc'

export default function DownloadReportButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState<number | ''>('')

  const generateReport = trpc.reports.generateReport.useMutation()

  const handleDownload = async () => {
    try {
      const base64Data = await generateReport.mutateAsync({
        year,
        month: month || undefined,
      })

      // Декодируем base64 в бинарные данные
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // Создаем Blob из бинарных данных
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      // Создаем URL для скачивания
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `all-courses-report-${year}${month ? `-${month}` : ''}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)

      // Закрываем диалог
      setIsOpen(false)
    } catch (error) {
      console.error('Error downloading report:', error)
      alert('Xatolik yuz berdi: Hisobot yuklab olinmadi')
    }
  }

  // Генерируем список лет (последние 5 лет)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Excel hisobot
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Barcha kurslar hisobotini yuklab olish</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="year">Yil</Label>
            <Select
              value={year.toString()}
              onValueChange={(value) => setYear(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Yilni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y} yil
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="month">Oy (ixtiyoriy)</Label>
            <Select
              value={month.toString()}
              onValueChange={(value) =>
                setMonth(value !== 'all' ? parseInt(value) : '')
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Oyni tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha oylar</SelectItem>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {getMonthName(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleDownload}
            disabled={generateReport.isPending}
            className="w-full"
          >
            {generateReport.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Yuklanmoqda...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Yuklab olish
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function getMonthName(monthNumber: number, locale = 'uz-Latn') {
  // monthNumber = 1..12
  const date = new Date(2000, monthNumber - 1, 1) // фиктивный год и день
  return date.toLocaleString(locale, { month: 'long' })
}

import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'

export function ModeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="border dark:border-black border-white"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <Sun
          size={18}
          className="w-full h-full scale-100 rotate-0 transition-all light:scale-0 light:-rotate-90 stroke-white dark:stroke-black"
        />
      ) : (
        <Moon className="absolute w-full h-full light:scale-0 light:rotate-90 transition-all dark:scale-100 dark:rotate-0 stroke-white dark:stroke-black" />
      )}
    </Button>
  )
}

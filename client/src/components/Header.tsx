import React from 'react'
import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { 
  Sun, 
  Moon, 
  Wifi, 
  WifiOff,
  Settings
} from 'lucide-react'

export const Header: React.FC = () => {
  const { isOnline, theme, setTheme } = useAppStore()

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shadow-sm">
      {/* 左侧 Logo 和标题 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">F</span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">FlowMind</h1>
        </div>
        
        {/* 在线状态指示器 */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3 text-green-500" />
              <span>在线</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-yellow-500" />
              <span>离线</span>
            </>
          )}
        </div>
      </div>

      {/* 右侧工具栏 */}
      <div className="flex items-center gap-2">
        {/* 主题切换按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className="hover:bg-accent"
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>

        {/* 设置按钮 */}
        <Button
          variant="outline"
          size="sm"
          className="hover:bg-accent"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
} 
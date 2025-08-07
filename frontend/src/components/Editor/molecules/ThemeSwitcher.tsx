import React, { useState } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'

import { Moon, Settings, Sun } from 'lucide-react'

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme, isDark, isLight } = useTheme()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <div className='flex items-center gap-2 p-2'>
      <div className='flex flex-col gap-1'>
        <div className='text-sm text-muted-foreground'>主题</div>
        <div className='flex items-center gap-1'>
          <Button variant="outline" size="sm">
            <Sun size={16} />
          </Button>
        </div>
        <div className='flex items-center gap-1'>
          <Button variant="outline" size="sm">
            <Moon size={16} />
          </Button>
        </div>
        <div className='flex items-center gap-1'>
          <Button variant="outline" size="sm">
            <Settings size={16} />
          </Button>
        </div>
      </div>
      <div className='flex items-center gap-1'>
        <Button variant="outline" size="sm" onClick={toggleTheme}>
          <span>快速切换</span>
        </Button>
        <Button variant="outline" size="sm" onClick={toggleTheme}>
        </Button>
        {showAdvanced && (
          <div className='flex items-center gap-1'>
           <div className='p-2 border border-border rounded-md'>
             <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
               <div>当前主题: {theme}</div>
               <div>主题类型: {isDark ? '深色' : isLight ? '浅色' : '系统'}</div>
             </div>
            </div>
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? '隐藏' : '显示'}高级选项
      </Button>
    </div>
  )

}

export default ThemeSwitcher 
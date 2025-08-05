import React from 'react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/app-store'
import { Menu, Settings, User, Wifi, WifiOff } from 'lucide-react'

export const Header: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar, isOnline, user } = useAppStore()

  return (
    <header className="h-12 border-b border-border bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">FlowMind</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* 网络状态指示器 */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span>{isOnline ? '在线' : '离线'}</span>
        </div>

        {/* 用户信息 */}
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">{user.name}</span>
            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
              {user.subscription === 'pro' ? '专业版' : '免费版'}
            </span>
          </div>
        ) : (
          <Button variant="outline" size="sm">
            <User className="h-4 w-4 mr-2" />
            登录
          </Button>
        )}

        {/* 设置按钮 */}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
} 
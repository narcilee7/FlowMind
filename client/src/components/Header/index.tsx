import React from 'react'
import { useAppStore } from '@/stores/app-store'
import OnlineShowView from './OnlineShowView'
import ThemeToggle from './ThemeToggle'
import SettingsButton from './SettingsButton'
import RightButtonGroup from './RightButtonGroup'

export const Header: React.FC = () => {
  const { isOnline } = useAppStore()

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
        <OnlineShowView isOnline={isOnline} />
      </div>

      <RightButtonGroup>
        <ThemeToggle />
        <SettingsButton />
      </RightButtonGroup>
    </header>
  )
} 
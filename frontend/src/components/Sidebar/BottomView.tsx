import React from 'react'
import { useAppStore } from '@/stores/app-store'
import OnlineShowView from '@/components/Header/OnlineShowView'

export interface BottomViewProps {
  isSidebarCollapsed: boolean
}

const BottomView: React.FC<BottomViewProps> = ({ isSidebarCollapsed }) => {
  const { isOnline } = useAppStore()

  if (isSidebarCollapsed) return null
  
  return (
    <div className='p-2 border-t border-border'>
      <div className='flex items-center justify-between'>
        <OnlineShowView isOnline={isOnline} />
        <span className='text-sm text-muted-foreground'>版本: 1.0.0</span>
        <span className='text-sm text-muted-foreground'>构建: {new Date().toLocaleDateString()}</span>
      </div>
    </div>
  )
}

export default BottomView
import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface CollapsedButtonProps {
  isSidebarCollapsed: boolean
  toggleSidebar: () => void
}

const CollapsedButton: React.FC<CollapsedButtonProps> = ({ 
  isSidebarCollapsed, 
  toggleSidebar,
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleSidebar}
      className='absolute top-1/2 right-0 -translate-y-1/2 z-10 bg-background border border-border shadow-sm hover:bg-accent hover:text-accent-foreground'
      title={isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
    >
      {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
    </Button>
  )
}

export default CollapsedButton
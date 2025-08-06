/**
 * CollapsedButton组件 - 使用styled-components实现
 */

import React from 'react'
import styled from 'styled-components'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton } from '@/components/ui/icon-button'

export interface CollapsedButtonProps {
  isSidebarCollapsed: boolean
  toggleSidebar: () => void
  className?: string
}

const StyledCollapsedButton = styled(IconButton)`
  position: absolute;
  top: 0.5rem;
  right: -1rem;
  z-index: 10;
  background: var(--background);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  
  &:hover {
    background: var(--accent);
    border-color: var(--accent-foreground);
  }
`

const CollapsedButton: React.FC<CollapsedButtonProps> = ({ 
  isSidebarCollapsed, 
  toggleSidebar, 
  className 
}) => {
  return (
    <StyledCollapsedButton
      variant="outline"
      size="sm"
      onClick={toggleSidebar}
      className={className}
      title={isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
    >
      {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
    </StyledCollapsedButton>
  )
}

export default CollapsedButton
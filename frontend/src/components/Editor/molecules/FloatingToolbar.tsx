/**
 * FloatingToolbar组件 - 使用styled-components实现
 */

import React from 'react'
import styled from 'styled-components'
import { Bold, Italic, Underline, Link, Quote, Code } from 'lucide-react'
import { IconButton } from '@/components/ui/icon-button'

export interface FloatingToolbarProps {
  isVisible: boolean
  position: { x: number; y: number }
  onAction?: (action: string) => void
  className?: string
}

const FloatingToolbarContainer = styled.div<{ isVisible: boolean; x: number; y: number }>`
  position: fixed;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  display: ${props => props.isVisible ? 'flex' : 'none'};
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  transform: translate(-50%, -100%);
  margin-top: -0.5rem;
`

const ToolbarButton = styled(IconButton)`
  &:hover {
    background: var(--accent);
    color: var(--accent-foreground);
  }
`

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ 
  isVisible, 
  position, 
  onAction, 
  className 
}) => {
  const handleAction = (action: string) => {
    onAction?.(action)
  }

  return (
    <FloatingToolbarContainer
      isVisible={isVisible}
      x={position.x}
      y={position.y}
      className={className}
    >
      <ToolbarButton
        variant="ghost"
        size="sm"
        onClick={() => handleAction('bold')}
        title="粗体"
      >
        <Bold size={14} />
      </ToolbarButton>
      
      <ToolbarButton
        variant="ghost"
        size="sm"
        onClick={() => handleAction('italic')}
        title="斜体"
      >
        <Italic size={14} />
      </ToolbarButton>
      
      <ToolbarButton
        variant="ghost"
        size="sm"
        onClick={() => handleAction('underline')}
        title="下划线"
      >
        <Underline size={14} />
      </ToolbarButton>
      
      <ToolbarButton
        variant="ghost"
        size="sm"
        onClick={() => handleAction('link')}
        title="链接"
      >
        <Link size={14} />
      </ToolbarButton>
      
      <ToolbarButton
        variant="ghost"
        size="sm"
        onClick={() => handleAction('quote')}
        title="引用"
      >
        <Quote size={14} />
      </ToolbarButton>
      
      <ToolbarButton
        variant="ghost"
        size="sm"
        onClick={() => handleAction('code')}
        title="代码"
      >
        <Code size={14} />
      </ToolbarButton>
    </FloatingToolbarContainer>
  )
}

export default FloatingToolbar

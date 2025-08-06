/**
 * Toolbar组件 - 使用styled-components实现
 */

import React from 'react'
import styled from 'styled-components'

export interface ToolbarProps {
  children: React.ReactNode
  className?: string
  orientation?: 'horizontal' | 'vertical'
  variant?: 'default' | 'bordered' | 'elevated'
}

const StyledToolbar = styled.div<{ orientation: 'horizontal' | 'vertical'; variant: string }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  
  ${props => props.orientation === 'vertical' && `
    flex-direction: column;
    align-items: stretch;
  `}
  
  ${props => props.variant === 'bordered' && `
    border: 2px solid var(--border);
  `}
  
  ${props => props.variant === 'elevated' && `
    box-shadow: var(--shadow-md);
  `}
`

export const Toolbar: React.FC<ToolbarProps> = ({
  children,
  className,
  orientation = 'horizontal',
  variant = 'default',
  ...props
}) => {
  return (
    <StyledToolbar
      className={className}
      orientation={orientation}
      variant={variant}
      {...props}
    >
      {children}
    </StyledToolbar>
  )
}

export default Toolbar 
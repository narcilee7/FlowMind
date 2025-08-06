/**
 * IconButton组件 - 使用styled-components实现
 */

import React from 'react'
import styled, { css } from 'styled-components'

export interface IconButtonProps {
  children: React.ReactNode
  variant?: 'default' | 'ghost' | 'outline' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: () => void
  className?: string
  title?: string
}

const buttonVariants = {
  default: css`
    background: var(--primary);
    color: var(--primary-foreground);
    border: 1px solid var(--primary);
    
    &:hover:not(:disabled) {
      background: var(--primary);
      opacity: 0.9;
    }
  `,
  ghost: css`
    background: transparent;
    color: var(--foreground);
    border: 1px solid transparent;
    
    &:hover:not(:disabled) {
      background: var(--accent);
      color: var(--accent-foreground);
    }
  `,
  outline: css`
    background: transparent;
    color: var(--foreground);
    border: 1px solid var(--border);
    
    &:hover:not(:disabled) {
      background: var(--accent);
      color: var(--accent-foreground);
    }
  `,
  destructive: css`
    background: var(--destructive);
    color: var(--destructive-foreground);
    border: 1px solid var(--destructive);
    
    &:hover:not(:disabled) {
      background: var(--destructive);
      opacity: 0.9;
    }
  `
}

const buttonSizes = {
  sm: css`
    width: 2rem;
    height: 2rem;
    font-size: 0.75rem;
  `,
  md: css`
    width: 2.5rem;
    height: 2.5rem;
    font-size: 0.875rem;
  `,
  lg: css`
    width: 3rem;
    height: 3rem;
    font-size: 1rem;
  `
}

const StyledIconButton = styled.button<IconButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  font-family: inherit;
  
  ${props => buttonVariants[props.variant || 'default']}
  ${props => buttonSizes[props.size || 'md']}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:focus {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
`

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  variant = 'default',
  size = 'md',
  disabled = false,
  onClick,
  className,
  title,
  ...props
}) => {
  return (
    <StyledIconButton
      variant={variant}
      size={size}
      disabled={disabled}
      onClick={onClick}
      className={className}
      title={title}
      {...props}
    >
      {children}
    </StyledIconButton>
  )
}

export default IconButton 
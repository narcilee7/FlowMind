/**
 * Button组件 - 使用styled-components实现
 */

import React from 'react'
import styled, { css } from 'styled-components'

export interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

const buttonVariants = {
  default: css`
    background: var(--primary);
    color: var(--primary-foreground);
    border: 1px solid var(--primary);
    transition: all 0.3s ease-in-out;
    
    &:hover:not(:disabled) {
      background: var(--primary);
      opacity: 0.9;
    }
    
    &:focus {
      outline: 2px solid var(--ring);
      outline-offset: 2px;
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
  secondary: css`
    background: var(--secondary);
    color: var(--secondary-foreground);
    border: 1px solid var(--secondary);
    
    &:hover:not(:disabled) {
      background: var(--secondary);
      opacity: 0.8;
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
  link: css`
    background: transparent;
    color: var(--primary);
    border: 1px solid transparent;
    text-decoration: underline;
    
    &:hover:not(:disabled) {
      color: var(--primary);
      opacity: 0.8;
    }
  `
}

const buttonSizes = {
  default: css`
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 500;
  `,
  sm: css`
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: 500;
  `,
  lg: css`
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    line-height: 1.5rem;
    font-weight: 500;
  `,
  icon: css`
    padding: 0.5rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 500;
    width: 2.5rem;
    height: 2.5rem;
  `
}

const StyledButton = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  font-family: inherit;
  
  ${props => buttonVariants[props.variant || 'default']}
  ${props => buttonSizes[props.size || 'default']}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:focus {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
`

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'default',
  disabled = false,
  children,
  onClick,
  className,
  type = 'button',
  ...props
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      disabled={disabled}
      onClick={onClick}
      className={className}
      type={type}
      {...props}
    >
      {children}
    </StyledButton>
  )
}

export default Button 
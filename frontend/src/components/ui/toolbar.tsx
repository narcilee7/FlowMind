import React from 'react'
import { cn } from '@/utils/cn'

interface ToolbarProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'border'
}

export const Toolbar: React.FC<ToolbarProps> = ({
  children,
  className,
  variant = 'default'
}) => {
  return (
    <div className={cn(
      'flex items-center justify-between px-4 py-2',
      variant === 'border' && 'border-b border-border',
      'bg-card shadow-sm',
      className
    )}>
      {children}
    </div>
  )
}

export const ToolbarGroup: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {children}
    </div>
  )
} 
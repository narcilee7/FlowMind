import React from 'react'
import { cn } from '@/utils/cn'

interface PanelProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'border'
  size?: 'sm' | 'md' | 'lg'
}

export const Panel: React.FC<PanelProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md'
}) => {
  return (
    <div className={cn(
      'bg-background',
      variant === 'border' && 'border border-border',
      size === 'sm' && 'p-2',
      size === 'md' && 'p-4',
      size === 'lg' && 'p-6',
      className
    )}>
      {children}
    </div>
  )
}

export const PanelHeader: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  )
}

export const PanelTitle: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  return (
    <h3 className={cn('text-lg font-semibold text-foreground', className)}>
      {children}
    </h3>
  )
} 
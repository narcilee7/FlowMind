import React from 'react'
import { cn } from '@/utils/cn'
import { Button } from './button'
import { LucideIcon } from 'lucide-react'

interface IconButtonProps {
  icon: LucideIcon
  onClick?: () => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: ButtonSize
  disabled?: boolean
  className?: string
  title?: string
}

type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  onClick,
  variant = 'outline',
  size = 'sm',
  disabled = false,
  className,
  title,
}) => {
  return (
    <Button
      variant={variant}
      size={size as ButtonSize}
      onClick={onClick}
      disabled={disabled}
      className={cn('p-2', className)}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
} 
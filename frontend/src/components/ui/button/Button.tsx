import React from 'react'
import classNames from 'classnames'

export interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

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
  const classes = classNames(
    'btn',
    {
      'btn-default': variant === 'default',
      'btn-destructive': variant === 'destructive',
      'btn-outline': variant === 'outline',
      'btn-secondary': variant === 'secondary',
      'btn-ghost': variant === 'ghost',
      'btn-link': variant === 'link',
    },
    {
      'btn-sm': size === 'sm',
      'btn-lg': size === 'lg',
      'btn-icon': size === 'icon',
    },
    className
  )

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={onClick}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button 
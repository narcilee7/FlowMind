import React from 'react'
import classNames from 'classnames'
import styles from './Button.module.scss'

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
    styles.button,
    styles[`button__${variant}`],
    styles[`button__${size === 'default' ? 'default-size' : size}`],
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
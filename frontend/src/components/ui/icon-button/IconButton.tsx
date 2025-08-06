import * as React from "react"
import { cn } from "@/utils/cn"
import "./IconButton.scss"

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'default' | 'lg'
  icon?: React.ComponentType<{ className?: string }>
  title?: string
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = 'default', icon: Icon, title, children, ...props }, ref) => {
    const iconButtonClasses = cn(
      'icon-btn',
      `icon-btn--${size}`,
      className
    )

    return (
      <button
        className={iconButtonClasses}
        ref={ref}
        title={title}
        {...props}
      >
        {Icon && <Icon className="h-4 w-4" />}
        {children}
      </button>
    )
  }
)
IconButton.displayName = "IconButton"

export { IconButton } 
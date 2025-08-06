import * as React from "react"
import { cn } from "@/utils/cn"
import "./Toolbar.scss"

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'border'
}

const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ className, children, variant = 'default', ...props }, ref) => {
    const toolbarClasses = cn('toolbar', `toolbar--${variant}`, className)

    return (
      <div
        className={toolbarClasses}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Toolbar.displayName = "Toolbar"

export interface ToolbarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const ToolbarGroup = React.forwardRef<HTMLDivElement, ToolbarGroupProps>(
  ({ className, children, ...props }, ref) => {
    const toolbarGroupClasses = cn('toolbar-group', className)

    return (
      <div
        className={toolbarGroupClasses}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ToolbarGroup.displayName = "ToolbarGroup"

export { Toolbar, ToolbarGroup } 
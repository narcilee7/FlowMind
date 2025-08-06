import * as React from "react"
import { cn } from "@/utils/cn"
import "./Panel.scss"

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, children, ...props }, ref) => {
    const panelClasses = cn('panel', className)

    return (
      <div
        className={panelClasses}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Panel.displayName = "Panel"

export interface PanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const PanelHeader = React.forwardRef<HTMLDivElement, PanelHeaderProps>(
  ({ className, children, ...props }, ref) => {
    const panelHeaderClasses = cn('panel-header', className)

    return (
      <div
        className={panelHeaderClasses}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PanelHeader.displayName = "PanelHeader"

export interface PanelTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

const PanelTitle = React.forwardRef<HTMLHeadingElement, PanelTitleProps>(
  ({ className, children, ...props }, ref) => {
    const panelTitleClasses = cn('panel-title', className)

    return (
      <h3
        className={panelTitleClasses}
        ref={ref}
        {...props}
      >
        {children}
      </h3>
    )
  }
)
PanelTitle.displayName = "PanelTitle"

export { Panel, PanelHeader, PanelTitle } 
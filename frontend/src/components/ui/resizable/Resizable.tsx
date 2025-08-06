import * as React from "react"
import { cn } from "@/utils/cn"
import "./Resizable.scss"

export interface ResizableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  direction?: 'horizontal' | 'vertical'
  onResize?: (size: number) => void
}

const Resizable = React.forwardRef<HTMLDivElement, ResizableProps>(
  ({ className, children, direction = 'vertical', onResize, ...props }, ref) => {
    const resizableClasses = cn('resizable', className)

    return (
      <div
        className={resizableClasses}
        ref={ref}
        {...props}
      >
        {children}
        <div className={`resizable__handle resizable__handle--${direction}`} />
      </div>
    )
  }
)
Resizable.displayName = "Resizable"

export interface ResizablePanelGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  direction?: 'horizontal' | 'vertical'
}

const ResizablePanelGroup = React.forwardRef<HTMLDivElement, ResizablePanelGroupProps>(
  ({ className, children, direction = 'horizontal', ...props }, ref) => {
    const resizablePanelGroupClasses = cn('resizable-panel-group', `resizable-panel-group--${direction}`, className)

    return (
      <div
        className={resizablePanelGroupClasses}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ResizablePanelGroup.displayName = "ResizablePanelGroup"

export interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  defaultSize?: number
  minSize?: number
  maxSize?: number
}

const ResizablePanel = React.forwardRef<HTMLDivElement, ResizablePanelProps>(
  ({ className, children, defaultSize = 50, minSize = 10, maxSize = 90, ...props }, ref) => {
    const resizablePanelClasses = cn('resizable-panel', className)

    return (
      <div
        className={resizablePanelClasses}
        ref={ref}
        style={{ 
          flex: `0 0 ${defaultSize}%`,
          minWidth: `${minSize}%`,
          maxWidth: `${maxSize}%`
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ResizablePanel.displayName = "ResizablePanel"

export interface ResizableHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical'
}

const ResizableHandle = React.forwardRef<HTMLDivElement, ResizableHandleProps>(
  ({ className, direction = 'horizontal', ...props }, ref) => {
    const resizableHandleClasses = cn('resizable-handle', `resizable-handle--${direction}`, className)

    return (
      <div
        className={resizableHandleClasses}
        ref={ref}
        {...props}
      />
    )
  }
)
ResizableHandle.displayName = "ResizableHandle"

export { Resizable, ResizablePanelGroup, ResizablePanel, ResizableHandle }

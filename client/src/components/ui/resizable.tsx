import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/utils/cn'

interface ResizablePanelProps {
  children: React.ReactNode
  defaultSize?: number
  minSize?: number
  maxSize?: number
  className?: string
}

interface ResizablePanelGroupProps {
  children: React.ReactNode
  direction?: 'horizontal' | 'vertical'
  className?: string
}

interface ResizableHandleProps {
  className?: string
}

export const ResizablePanelGroup: React.FC<ResizablePanelGroupProps> = ({
  children,
  direction = 'horizontal',
  className
}) => {
  return (
    <div className={cn(
      'flex',
      direction === 'horizontal' ? 'flex-row' : 'flex-col',
      className
    )}>
      {children}
    </div>
  )
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  defaultSize = 50,
  minSize = 10,
  maxSize = 90,
  className
}) => {
  const [size, setSize] = useState(defaultSize)
  const panelRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={panelRef}
      className={cn('relative', className)}
      style={{ 
        flex: `${size} 0 0%`,
        minWidth: `${minSize}%`,
        maxWidth: `${maxSize}%`
      }}
    >
      {children}
    </div>
  )
}

export const ResizableHandle: React.FC<ResizableHandleProps> = ({
  className
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const handleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = handleRef.current
    if (!handle) return

    let startX = 0
    let startWidth = 0

    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true)
      startX = e.clientX
      
      const prevPanel = handle.previousElementSibling as HTMLElement
      if (prevPanel) {
        startWidth = prevPanel.offsetWidth
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const deltaX = e.clientX - startX
      const prevPanel = handle.previousElementSibling as HTMLElement
      const nextPanel = handle.nextElementSibling as HTMLElement
      
      if (prevPanel && nextPanel) {
        const container = prevPanel.parentElement
        if (container) {
          const containerWidth = container.offsetWidth
          const newWidth = Math.max(100, Math.min(containerWidth - 100, startWidth + deltaX))
          const newSize = (newWidth / containerWidth) * 100
          
          prevPanel.style.flex = `${newSize} 0 0%`
          nextPanel.style.flex = `${100 - newSize} 0 0%`
        }
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    handle.addEventListener('mousedown', handleMouseDown)

    return () => {
      handle.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  return (
    <div
      ref={handleRef}
      className={cn(
        'w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors',
        isDragging && 'bg-primary',
        className
      )}
    />
  )
} 
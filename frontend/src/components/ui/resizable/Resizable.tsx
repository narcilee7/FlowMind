/**
 * Resizable组件 - 使用styled-components实现
 */

import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'

export interface ResizableProps {
  children: React.ReactNode
  className?: string
  direction?: 'horizontal' | 'vertical' | 'both'
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  defaultWidth?: number
  defaultHeight?: number
  onResize?: (width: number, height: number) => void
}

const ResizableContainer = styled.div<{ width?: number; height?: number }>`
  position: relative;
  width: ${props => props.width ? `${props.width}px` : 'auto'};
  height: ${props => props.height ? `${props.height}px` : 'auto'};
  overflow: hidden;
`

const ResizeHandle = styled.div<{ direction: string }>`
  position: absolute;
  background: var(--border);
  transition: background 0.2s ease;
  
  ${props => props.direction === 'horizontal' && `
    right: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    cursor: col-resize;
    
    &:hover {
      background: var(--primary);
    }
  `}
  
  ${props => props.direction === 'vertical' && `
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    cursor: row-resize;
    
    &:hover {
      background: var(--primary);
    }
  `}
  
  ${props => props.direction === 'both' && `
    right: 0;
    bottom: 0;
    width: 8px;
    height: 8px;
    cursor: nw-resize;
    
    &:hover {
      background: var(--primary);
    }
  `}
`

export const Resizable: React.FC<ResizableProps> = ({
  children,
  className,
  direction = 'horizontal',
  minWidth = 100,
  maxWidth = 800,
  minHeight = 100,
  maxHeight = 600,
  defaultWidth,
  defaultHeight,
  onResize,
  ...props
}) => {
  const [width, setWidth] = useState(defaultWidth)
  const [height, setHeight] = useState(defaultHeight)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startPos = useRef({ x: 0, y: 0 })
  const startSize = useRef({ width: 0, height: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startPos.current = { x: e.clientX, y: e.clientY }
    startSize.current = { width: width || 0, height: height || 0 }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return

    const deltaX = e.clientX - startPos.current.x
    const deltaY = e.clientY - startPos.current.y

    if (direction === 'horizontal' || direction === 'both') {
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startSize.current.width + deltaX))
      setWidth(newWidth)
    }

    if (direction === 'vertical' || direction === 'both') {
      const newHeight = Math.max(minHeight, Math.min(maxHeight, startSize.current.height + deltaY))
      setHeight(newHeight)
    }

    onResize?.(width || 0, height || 0)
  }

  const handleMouseUp = () => {
    setIsResizing(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  return (
    <ResizableContainer
      ref={containerRef}
      className={className}
      width={width}
      height={height}
      {...props}
    >
      {children}
      <ResizeHandle
        direction={direction}
        onMouseDown={handleMouseDown}
      />
    </ResizableContainer>
  )
}

export default Resizable

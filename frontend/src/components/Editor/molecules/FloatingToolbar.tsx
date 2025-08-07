import React from 'react'
import { Bold, Italic, Underline, Link, Quote, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

export interface FloatingToolbarProps {
  isVisible: boolean
  position: { x: number; y: number }
  onAction?: (action: string) => void
  className?: string
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ 
  isVisible, 
  position, 
  onAction, 
  className 
}) => {
  const handleAction = (action: string) => {
    onAction?.(action)
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed flex items-center gap-1 p-2 bg-background border border-border rounded-lg shadow-lg z-[1000] transform -translate-x-1/2 -translate-y-full -mt-2",
        className
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleAction('bold')}
        title="粗体"
        className="hover:bg-accent hover:text-accent-foreground"
      >
        <Bold size={14} />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleAction('italic')}
        title="斜体"
        className="hover:bg-accent hover:text-accent-foreground"
      >
        <Italic size={14} />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleAction('underline')}
        title="下划线"
        className="hover:bg-accent hover:text-accent-foreground"
      >
        <Underline size={14} />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleAction('link')}
        title="链接"
        className="hover:bg-accent hover:text-accent-foreground"
      >
        <Link size={14} />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleAction('quote')}
        title="引用"
        className="hover:bg-accent hover:text-accent-foreground"
      >
        <Quote size={14} />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleAction('code')}
        title="代码"
        className="hover:bg-accent hover:text-accent-foreground"
      >
        <Code size={14} />
      </Button>
    </div>
  )
}

export default FloatingToolbar

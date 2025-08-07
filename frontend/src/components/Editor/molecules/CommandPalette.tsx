import React, { useState, useEffect, useRef } from 'react'
import { Search, FileText, Settings, Palette, Bot, HelpCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface CommandItem {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  action: () => void
  category: string
}

export interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (item: CommandItem) => void
  className?: string
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelect, className }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commandItems: CommandItem[] = [
    {
      id: 'new-file',
      title: '新建文件',
      description: '创建一个新的文档',
      icon: <FileText size={16} />,
      action: () => console.log('新建文件'),
      category: '文件'
    },
    {
      id: 'settings',
      title: '设置',
      description: '打开应用设置',
      icon: <Settings size={16} />,
      action: () => console.log('打开设置'),
      category: '系统'
    },
    {
      id: 'theme',
      title: '切换主题',
      description: '在浅色和深色主题之间切换',
      icon: <Palette size={16} />,
      action: () => console.log('切换主题'),
      category: '外观'
    },
    {
      id: 'ai-assistant',
      title: 'AI助手',
      description: '打开AI助手面板',
      icon: <Bot size={16} />,
      action: () => console.log('打开AI助手'),
      category: 'AI'
    },
    {
      id: 'help',
      title: '帮助',
      description: '查看帮助文档',
      icon: <HelpCircle size={16} />,
      action: () => console.log('打开帮助'),
      category: '系统'
    }
  ]

  const filteredItems = commandItems.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [searchTerm])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % filteredItems.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length)
        break
      case 'Enter':
        e.preventDefault()
        if (filteredItems[selectedIndex]) {
          onSelect(filteredItems[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[1000] flex items-start justify-center pt-[10vh]"
      onClick={onClose}
    >
      <div 
        className={cn(
          "bg-background border border-border rounded-lg shadow-2xl w-[90%] max-w-[600px] max-h-[60vh] overflow-hidden",
          className
        )}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border bg-muted">
          <div className="flex items-center gap-2">
            <Search size={16} />
            <input
              ref={inputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索命令..."
              className="flex-1 p-2 border-none bg-transparent text-foreground text-base focus:outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-3 p-3 cursor-pointer",
                index === selectedIndex 
                  ? "bg-accent text-accent-foreground" 
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => onSelect(item)}
            >
              <div className="w-6 h-6 flex items-center justify-center text-muted-foreground">
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{item.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
              </div>
              <div className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                {item.category}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CommandPalette 
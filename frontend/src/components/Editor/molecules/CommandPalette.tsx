/**
 * CommandPalette组件 - 使用styled-components实现
 */

import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { Search, FileText, Settings, Palette, Bot, HelpCircle } from 'lucide-react'

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

const CommandPaletteOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
`

const CommandPaletteContainer = styled.div`
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-xl);
  width: 90%;
  max-width: 600px;
  max-height: 60vh;
  overflow: hidden;
`

const CommandPaletteHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid var(--border);
  background: var(--muted);
`

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const SearchInput = styled.input`
  flex: 1;
  padding: 0.5rem;
  border: none;
  background: transparent;
  color: var(--foreground);
  font-size: 1rem;
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: var(--muted-foreground);
  }
`

const CommandPaletteList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`

const CommandItem = styled.div<{ isSelected: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  background: ${props => props.isSelected ? 'var(--accent)' : 'transparent'};
  color: ${props => props.isSelected ? 'var(--accent-foreground)' : 'var(--foreground)'};
  
  &:hover {
    background: var(--accent);
    color: var(--accent-foreground);
  }
`

const ItemIcon = styled.div`
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted-foreground);
`

const ItemContent = styled.div`
  flex: 1;
`

const ItemTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
`

const ItemDescription = styled.div`
  font-size: 0.75rem;
  color: var(--muted-foreground);
  margin-top: 0.125rem;
`

const ItemCategory = styled.div`
  font-size: 0.75rem;
  color: var(--muted-foreground);
  padding: 0.25rem 0.5rem;
  background: var(--muted);
  border-radius: 0.25rem;
`

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
    <CommandPaletteOverlay isOpen={isOpen} onClick={onClose}>
      <CommandPaletteContainer onClick={e => e.stopPropagation()} className={className}>
        <CommandPaletteHeader>
          <SearchContainer>
            <Search size={16} />
            <SearchInput
              ref={inputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索命令..."
            />
          </SearchContainer>
        </CommandPaletteHeader>
        
        <CommandPaletteList>
          {filteredItems.map((item, index) => (
            <CommandItem
              key={item.id}
              isSelected={index === selectedIndex}
              onClick={() => onSelect(item)}
            >
              <ItemIcon>{item.icon}</ItemIcon>
              <ItemContent>
                <ItemTitle>{item.title}</ItemTitle>
                <ItemDescription>{item.description}</ItemDescription>
              </ItemContent>
              <ItemCategory>{item.category}</ItemCategory>
            </CommandItem>
          ))}
        </CommandPaletteList>
      </CommandPaletteContainer>
    </CommandPaletteOverlay>
  )
}

export default CommandPalette 
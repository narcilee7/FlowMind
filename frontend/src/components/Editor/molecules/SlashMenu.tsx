/**
 * SlashMenu组件 - 使用styled-components实现
 */

import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { FileText, Image, Table, Calendar, Link } from 'lucide-react'

export interface SlashMenuItem {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  action: () => void
}

export interface SlashMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (item: SlashMenuItem) => void
  className?: string
}

const SlashMenuOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
`

const SlashMenuContainer = styled.div`
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  min-width: 300px;
  max-width: 500px;
  max-height: 400px;
  overflow: hidden;
`

const SlashMenuHeader = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
  background: var(--muted);
`

const SlashMenuInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: none;
  background: transparent;
  color: var(--foreground);
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: var(--muted-foreground);
  }
`

const SlashMenuList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`

const SlashMenuItem = styled.div<{ isSelected: boolean }>`
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

const SlashMenu: React.FC<SlashMenuProps> = ({ isOpen, onClose, onSelect, className }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const menuItems: SlashMenuItem[] = [
    {
      id: 'text',
      title: '文本',
      description: '插入文本内容',
      icon: <FileText size={16} />,
      action: () => console.log('插入文本')
    },
    {
      id: 'image',
      title: '图片',
      description: '插入图片',
      icon: <Image size={16} />,
      action: () => console.log('插入图片')
    },
    {
      id: 'table',
      title: '表格',
      description: '插入表格',
      icon: <Table size={16} />,
      action: () => console.log('插入表格')
    },
    {
      id: 'calendar',
      title: '日历',
      description: '插入日历组件',
      icon: <Calendar size={16} />,
      action: () => console.log('插入日历')
    },
    {
      id: 'link',
      title: '链接',
      description: '插入链接',
      icon: <Link size={16} />,
      action: () => console.log('插入链接')
    }
  ]

  const filteredItems = menuItems.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
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
    <SlashMenuOverlay isOpen={isOpen} onClick={onClose}>
      <SlashMenuContainer onClick={e => e.stopPropagation()} className={className}>
        <SlashMenuHeader>
          <SlashMenuInput
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索命令..."
          />
        </SlashMenuHeader>
        
        <SlashMenuList>
          {filteredItems.map((item, index) => (
            <SlashMenuItem
              key={item.id}
              isSelected={index === selectedIndex}
              onClick={() => onSelect(item)}
            >
              <ItemIcon>{item.icon}</ItemIcon>
              <ItemContent>
                <ItemTitle>{item.title}</ItemTitle>
                <ItemDescription>{item.description}</ItemDescription>
              </ItemContent>
            </SlashMenuItem>
          ))}
        </SlashMenuList>
      </SlashMenuContainer>
    </SlashMenuOverlay>
  )
}

export default SlashMenu 
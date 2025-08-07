import React, { useState, useEffect, useRef } from 'react'
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
}

const SlashMenu: React.FC<SlashMenuProps> = ({ isOpen, onClose, onSelect }) => {
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
    <div className='flex flex-col items-center gap-2 p-2 border border-border rounded-md'>
      <div className='flex items-center gap-2'>
        <div className='flex items-center gap-2'>
          <input
            className='w-full p-2 border border-border rounded-md'
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索命令..."
          />
        </div>
      </div>
      <div className='flex flex-col items-center gap-2'>
        {filteredItems.map((item) => (
          <div key={item.id} className='p-2 border border-border rounded-md'>
            <div className='flex items-center gap-2'>
              {item.icon}
              <span>{item.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SlashMenu 
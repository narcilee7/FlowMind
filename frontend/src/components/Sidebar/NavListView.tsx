import React from 'react'
import { Badge } from '../ui/badge'

export interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  path: string
  badge?: string | null
}

export interface NavListViewProps {
  isCollapsed: boolean
  menuList: NavItem[]
  onItemClick?: (item: NavItem) => void
}

const NavListView: React.FC<NavListViewProps> = ({ 
  isCollapsed, 
  menuList, 
  onItemClick
}) => {
  const handleItemClick = (item: NavItem) => {
    onItemClick?.(item)
  }

  return (
    <div
      className='flex flex-col gap-2 p-2 border-r border-border'
    >
      {menuList.map((item) => (
        <div key={item.id} className='flex items-center gap-2 p-2 rounded-md hover:bg-accent hover:text-accent-foreground' onClick={() => handleItemClick(item)}>
          {item.icon}
          <span>{item.label}</span>
          {!isCollapsed && item.badge && <Badge className='text-sm text-muted-foreground'>{item.badge}</Badge>}
        </div>
      ))}
    </div>
  )
}

export default NavListView
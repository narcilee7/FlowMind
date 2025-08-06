/**
 * NavListView组件 - 使用styled-components实现
 */

import React from 'react'
import styled from 'styled-components'

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
  className?: string
}

const NavListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
`

const NavItem = styled.div<{ isCollapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.25rem;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--foreground);
  
  &:hover {
    background: var(--accent);
    color: var(--accent-foreground);
  }
  
  ${props => props.isCollapsed && `
    justify-content: center;
    padding: 0.75rem 0.5rem;
  `}
`

const ItemIcon = styled.div`
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted-foreground);
`

const ItemContent = styled.div<{ isCollapsed: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  ${props => props.isCollapsed && `
    display: none;
  `}
`

const ItemLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
`

const ItemBadge = styled.span`
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  background: var(--primary);
  color: var(--primary-foreground);
  border-radius: 0.25rem;
  font-weight: 500;
`

const NavListView: React.FC<NavListViewProps> = ({ 
  isCollapsed, 
  menuList, 
  onItemClick, 
  className 
}) => {
  const handleItemClick = (item: NavItem) => {
    onItemClick?.(item)
  }

  return (
    <NavListContainer className={className}>
      {menuList.map((item) => (
        <NavItem
          key={item.id}
          isCollapsed={isCollapsed}
          onClick={() => handleItemClick(item)}
          title={isCollapsed ? item.label : undefined}
        >
          <ItemIcon>{item.icon}</ItemIcon>
          <ItemContent isCollapsed={isCollapsed}>
            <ItemLabel>{item.label}</ItemLabel>
            {item.badge && <ItemBadge>{item.badge}</ItemBadge>}
          </ItemContent>
        </NavItem>
      ))}
    </NavListContainer>
  )
}

export default NavListView
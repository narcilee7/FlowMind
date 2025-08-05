import React from 'react'
import { cn } from '@/utils/cn'
import { Panel, PanelHeader, PanelTitle } from '@/components/ui/panel'
import { List, ListChecks } from 'lucide-react'

interface TocItem {
  id: string
  title: string
  level: number
  children?: TocItem[]
}

interface TableOfContentsProps {
  items: TocItem[]
  activeId?: string
  onItemClick?: (id: string) => void
  className?: string
}

const TocItemComponent: React.FC<{
  item: TocItem
  activeId?: string
  onItemClick?: (id: string) => void
}> = ({ item, activeId, onItemClick }) => {
  const isActive = activeId === item.id
  const paddingLeft = item.level * 12

  return (
    <div>
      <button
        onClick={() => onItemClick?.(item.id)}
        className={cn(
          'w-full text-left px-2 py-1 rounded text-sm transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isActive && 'bg-primary text-primary-foreground',
          !isActive && 'text-muted-foreground'
        )}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {item.title}
      </button>
      {item.children?.map((child) => (
        <TocItemComponent
          key={child.id}
          item={child}
          activeId={activeId}
          onItemClick={onItemClick}
        />
      ))}
    </div>
  )
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  items,
  activeId,
  onItemClick,
  className
}) => {
  if (items.length === 0) {
    return (
      <Panel className={cn('h-full', className)}>
        <PanelHeader>
          <PanelTitle className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            目录
          </PanelTitle>
        </PanelHeader>
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          <div className="text-center">
            <List className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无目录</p>
          </div>
        </div>
      </Panel>
    )
  }

  return (
    <Panel className={cn('h-full overflow-auto', className)}>
      <PanelHeader>
        <PanelTitle className="flex items-center gap-2">
          <ListChecks className="h-4 w-4" />
          目录 ({items.length})
        </PanelTitle>
      </PanelHeader>
      <div className="space-y-1">
        {items.map((item) => (
          <TocItemComponent
            key={item.id}
            item={item}
            activeId={activeId}
            onItemClick={onItemClick}
          />
        ))}
      </div>
    </Panel>
  )
} 
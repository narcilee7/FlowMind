import React from 'react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/app-store'
import { 
  FileText, 
  FolderOpen, 
  Search, 
  Tag, 
  Link, 
  Calendar,
  Brain,
  Settings
} from 'lucide-react'

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed } = useAppStore()

  const menuItems = React.useMemo(() => {
    return [
      { icon: FileText, label: '文档', path: '/documents' },
      { icon: FolderOpen, label: '文件管理', path: '/files' },
      { icon: Search, label: '搜索', path: '/search' },
      { icon: Tag, label: '标签', path: '/tags' },
      { icon: Link, label: '链接', path: '/links' },
      { icon: Calendar, label: '时间轴', path: '/timeline' },
      { icon: Brain, label: 'AI助手', path: '/ai' },
      { icon: Settings, label: '设置', path: '/settings' },
    ]
  }, [])

  return (
    <aside className={`
      border-r border-border bg-background transition-all duration-300
      ${sidebarCollapsed ? 'w-16' : 'w-64'}
    `}>
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <Button
            key={item.path}
            variant="ghost"
            className={`
              w-full justify-start gap-3 h-10
              ${sidebarCollapsed ? 'px-2' : 'px-3'}
            `}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="truncate">{item.label}</span>
            )}
          </Button>
        ))}
      </nav>
    </aside>
  )
} 
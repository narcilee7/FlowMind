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
  Settings,
  ChevronLeft,
  ChevronRight,
  Palette
} from 'lucide-react'

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useAppStore()

  const menuItems = React.useMemo(() => {
    return [
      { icon: FileText, label: '文档', path: '/documents', badge: null },
      { icon: FolderOpen, label: '文件管理', path: '/files', badge: null },
      { icon: Search, label: '搜索', path: '/search', badge: null },
      { icon: Tag, label: '标签', path: '/tags', badge: '12' },
      { icon: Link, label: '链接', path: '/links', badge: '5' },
      { icon: Calendar, label: '时间轴', path: '/timeline', badge: null },
      { icon: Brain, label: 'AI助手', path: '/ai', badge: 'Pro' },
      { icon: Palette, label: '主题预览', path: '/theme', badge: null },
      { icon: Settings, label: '设置', path: '/settings', badge: null },
    ]
  }, [])

  return (
    <aside className={`
      border-r border-border bg-card transition-all duration-300 ease-in-out
      ${sidebarCollapsed ? 'w-16' : 'w-64'}
    `}>
      {/* 折叠/展开按钮 */}
      <div className="p-2 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full h-8 hover:bg-accent"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 导航菜单 */}
      <nav className="p-2 space-y-1">
        {menuItems.map((item) => (
          <Button
            key={item.path}
            variant="ghost"
            className={`
              w-full justify-start gap-3 h-10 relative group
              hover:bg-accent hover:text-accent-foreground
              ${sidebarCollapsed ? 'px-2' : 'px-3'}
            `}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!sidebarCollapsed && (
              <>
                <span className="truncate flex-1">{item.label}</span>
                {item.badge && (
                  <span className={`
                    text-xs px-2 py-0.5 rounded-full
                    ${item.badge === 'Pro' 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    {item.badge}
                  </span>
                )}
              </>
            )}
            
            {/* 悬停提示 */}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {item.label}
                {item.badge && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({item.badge})
                  </span>
                )}
              </div>
            )}
          </Button>
        ))}
      </nav>

      {/* 底部区域 */}
      <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-border bg-card">
        <div className={`
          flex items-center gap-2 text-xs text-muted-foreground
          ${sidebarCollapsed ? 'justify-center' : 'px-2'}
        `}>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          {!sidebarCollapsed && <span>FlowMind v1.0</span>}
        </div>
      </div>
    </aside>
  )
} 
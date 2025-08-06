import React from 'react'
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
  Palette
} from 'lucide-react'
import BottomView from './BottomView'
import CollapsedButton from './CollapsedButton'
import NavListView from './NavListView'

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useAppStore()

  const menuList = React.useMemo(() => {
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
      <CollapsedButton isSidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
      {/* 导航菜单 */}
      <NavListView isSidebarCollapsed={sidebarCollapsed} menuList={menuList} />
      {/* 底部区域 */}
      <BottomView isSidebarCollapsed={sidebarCollapsed} />
    </aside>
  )
}

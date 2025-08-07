
import React from 'react'
import CollapsedButton from './CollapsedButton'
import BottomView from './BottomView'
import NavListView from './NavListView'
import {
  FileText, FolderOpen, Search, Tag, Link,
  Calendar, Brain, Settings, Palette
} from 'lucide-react'
import { useAppStore } from '@/stores/app-store'

const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useAppStore()

  const menuList = React.useMemo(() => {
    return  [
      { id: 'documents', label: '文档', icon: <FileText size={16} />, path: '/documents', badge: null },
      { id: 'files', label: '文件管理', icon: <FolderOpen size={16} />, path: '/files', badge: null },
      { id: 'search', label: '搜索', icon: <Search size={16} />, path: '/search', badge: null },
      { id: 'tags', label: '标签', icon: <Tag size={16} />, path: '/tags', badge: '12' },
      { id: 'links', label: '链接', icon: <Link size={16} />, path: '/links', badge: '5' },
      { id: 'timeline', label: '时间轴', icon: <Calendar size={16} />, path: '/timeline', badge: null },
      { id: 'ai', label: 'AI助手', icon: <Brain size={16} />, path: '/ai', badge: 'Pro' },
      { id: 'theme', label: '主题预览', icon: <Palette size={16} />, path: '/theme', badge: null },
      { id: 'settings', label: '设置', icon: <Settings size={16} />, path: '/settings', badge: null },
    ]
  }, [])

  if (sidebarCollapsed) {
    return (
      <aside className='w-16 bg-background border-r border-border flex flex-col items-center'>
        <CollapsedButton
          isSidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />
        <div className='flex flex-col gap-2'>
          {menuList.map((item) => (
            <div key={item.id}>{item.label}</div>
          ))}
        </div>
        <BottomView isSidebarCollapsed={sidebarCollapsed} />
      </aside>
    )
  }

  return (
    <aside className='w-48 bg-background border-r border-border flex flex-col items-center'>
      <NavListView
        isCollapsed={sidebarCollapsed}
        menuList={menuList}
        onItemClick={(item) => console.log('导航到:', item.path)}
      />
      <BottomView isSidebarCollapsed={sidebarCollapsed} />
    </aside>
  )
}

export default Sidebar

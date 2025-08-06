/**
 * Sidebar组件 - 使用styled-components实现
 */

import React from 'react'
import styled from 'styled-components'
import CollapsedButton from './CollapsedButton'
import BottomView from './BottomView'
import NavListView from './NavListView'
import { 
  FileText, FolderOpen, Search, Tag, Link, 
  Calendar, Brain, Settings, Palette 
} from 'lucide-react'
import { useAppStore } from '@/stores/app-store'

const StyledSidebar = styled.aside<{ collapsed: boolean }>`
  width: ${props => props.collapsed ? '4rem' : '16rem'};
  background: var(--background);
  border-right: 1px solid var(--border);
  transition: width 0.3s ease;
  overflow: hidden;
`

const SidebarContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`

const SidebarHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const SidebarTitle = styled.h2<{ collapsed: boolean }>`
  font-size: 1rem;
  font-weight: 600;
  color: var(--foreground);
  margin: 0;
  opacity: ${props => props.collapsed ? 0 : 1};
  transition: opacity 0.3s ease;
`

const SidebarBody = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
`

const SidebarFooter = styled.div`
  padding: 1rem;
  border-top: 1px solid var(--border);
`

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  background: var(--background);
  color: var(--foreground);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--accent);
    border-color: var(--accent-foreground);
  }
`

const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useAppStore()

  return (
    <StyledSidebar collapsed={sidebarCollapsed}>
      <SidebarContent>
        <CollapsedButton 
          isSidebarCollapsed={sidebarCollapsed} 
          toggleSidebar={toggleSidebar} 
        />
        
        <SidebarHeader>
          <SidebarTitle collapsed={sidebarCollapsed}>
            {sidebarCollapsed ? '' : '导航'}
          </SidebarTitle>
        </SidebarHeader>
        
        <SidebarBody>
          <NavListView
            isCollapsed={sidebarCollapsed}
            menuList={[
              { id: 'documents', label: '文档', icon: <FileText size={16} />, path: '/documents', badge: null },
              { id: 'files', label: '文件管理', icon: <FolderOpen size={16} />, path: '/files', badge: null },
              { id: 'search', label: '搜索', icon: <Search size={16} />, path: '/search', badge: null },
              { id: 'tags', label: '标签', icon: <Tag size={16} />, path: '/tags', badge: '12' },
              { id: 'links', label: '链接', icon: <Link size={16} />, path: '/links', badge: '5' },
              { id: 'timeline', label: '时间轴', icon: <Calendar size={16} />, path: '/timeline', badge: null },
              { id: 'ai', label: 'AI助手', icon: <Brain size={16} />, path: '/ai', badge: 'Pro' },
              { id: 'theme', label: '主题预览', icon: <Palette size={16} />, path: '/theme', badge: null },
              { id: 'settings', label: '设置', icon: <Settings size={16} />, path: '/settings', badge: null },
            ]}
            onItemClick={(item) => console.log('导航到:', item.path)}
          />
        </SidebarBody>
        
        <BottomView isSidebarCollapsed={sidebarCollapsed} />
      </SidebarContent>
    </StyledSidebar>
  )
}

export default Sidebar

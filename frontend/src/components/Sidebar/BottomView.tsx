/**
 * BottomView组件 - 使用styled-components实现
 */

import React from 'react'
import styled from 'styled-components'
import { useAppStore } from '@/stores/app-store'
import OnlineShowView from '@/components/Header/OnlineShowView'

export interface BottomViewProps {
  isSidebarCollapsed: boolean
  className?: string
}

const BottomContainer = styled.div`
  padding: 1rem;
  border-top: 1px solid var(--border);
  background: var(--background);
`

const BottomContent = styled.div<{ collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  opacity: ${props => props.collapsed ? 0 : 1};
  transition: opacity 0.3s ease;
`

const StatusSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--muted-foreground);
`

const BottomView: React.FC<BottomViewProps> = ({ isSidebarCollapsed, className }) => {
  const { isOnline } = useAppStore()

  return (
    <BottomContainer className={className}>
      <BottomContent collapsed={isSidebarCollapsed}>
        <StatusSection>
          <span>状态</span>
          <OnlineShowView isOnline={isOnline} />
        </StatusSection>
        
        {!isSidebarCollapsed && (
          <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
            <div>版本: 1.0.0</div>
            <div>构建: 2024.01.01</div>
          </div>
        )}
      </BottomContent>
    </BottomContainer>
  )
}

export default BottomView
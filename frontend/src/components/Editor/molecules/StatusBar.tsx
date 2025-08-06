/**
 * StatusBar组件 - 使用styled-components实现
 */

import React from 'react'
import styled from 'styled-components'
import { useAppStore } from '@/stores/app-store'
import OnlineShowView from '@/components/Header/OnlineShowView'

export interface StatusBarProps {
  className?: string
}

const StatusBarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: var(--background);
  border-top: 1px solid var(--border);
  font-size: 0.75rem;
  color: var(--muted-foreground);
`

const StatusLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const StatusRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`

const StatusBar: React.FC<StatusBarProps> = ({ className }) => {
  const { isOnline } = useAppStore()

  return (
    <StatusBarContainer className={className}>
      <StatusLeft>
        <StatusItem>
          <span>就绪</span>
        </StatusItem>
        <StatusItem>
          <OnlineShowView isOnline={isOnline} />
        </StatusItem>
      </StatusLeft>
      
      <StatusRight>
        <StatusItem>
          <span>Ln 1, Col 1</span>
        </StatusItem>
        <StatusItem>
          <span>UTF-8</span>
        </StatusItem>
        <StatusItem>
          <span>TypeScript</span>
        </StatusItem>
      </StatusRight>
    </StatusBarContainer>
  )
}

export default StatusBar 
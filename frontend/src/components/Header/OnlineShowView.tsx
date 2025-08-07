/**
 * OnlineShowView组件 - 使用styled-components实现
 */

import React from 'react'
import styled from 'styled-components'
import { Wifi, WifiOff } from 'lucide-react'

export interface OnlineShowViewProps {
  isOnline: boolean
  className?: string
}

const OnlineContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s ease;
`

const OnlineIndicator = styled(OnlineContainer)<{ $isOnline: boolean }>`
  background: ${props => props.$isOnline ? 'var(--success)' : 'var(--destructive)'};
  color: ${props => props.$isOnline ? 'var(--success-foreground)' : 'var(--destructive-foreground)'};
`

const StatusDot = styled.div<{ $isOnline: boolean }>`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: currentColor;
  animation: ${props => props.$isOnline ? 'pulse' : 'none'} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`

const OnlineShowView: React.FC<OnlineShowViewProps> = ({ isOnline, className }) => {
    return (
    <OnlineIndicator $isOnline={isOnline} className={className}>
      {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
      <StatusDot $isOnline={isOnline} />
      <span>{isOnline ? '在线' : '离线'}</span>
    </OnlineIndicator>
  )
}

export default OnlineShowView
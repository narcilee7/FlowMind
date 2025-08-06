/**
 * SettingsButton组件 - 使用styled-components实现
 */

import React from 'react'
import styled from 'styled-components'
import { Settings } from 'lucide-react'
import { IconButton } from '@/components/ui/icon-button'

export interface SettingsButtonProps {
  onClick?: () => void
  className?: string
}

const StyledSettingsButton = styled(IconButton)`
  &:hover {
    background: var(--accent);
    color: var(--accent-foreground);
  }
`

const SettingsButton: React.FC<SettingsButtonProps> = ({ onClick, className }) => {
  return (
    <StyledSettingsButton
      variant="ghost"
      size="md"
      onClick={onClick}
      className={className}
      title="设置"
    >
      <Settings size={16} />
    </StyledSettingsButton>
  )
}

export default SettingsButton
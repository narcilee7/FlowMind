/**
 * RightButtonGroup组件 - 使用styled-components实现
 */

import React from 'react'
import styled from 'styled-components'
import ThemeToggle from './ThemeToggle'
import SettingsButton from './SettingsButton'

export interface RightButtonGroupProps {
  className?: string
}

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const RightButtonGroup: React.FC<RightButtonGroupProps> = ({ className }) => {
  return (
    <ButtonGroup className={className}>
      <ThemeToggle />
      <SettingsButton />
    </ButtonGroup>
  )
}

export default RightButtonGroup
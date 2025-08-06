/**
 * Header组件 - 使用styled-components实现
 */

import React from 'react'
import styled from 'styled-components'
import RightButtonGroup from './RightButtonGroup'

const StyledHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  height: 3.5rem;
  border-bottom: 1px solid var(--border);
  background: var(--background);
  color: var(--foreground);
`

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const Logo = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--foreground);
`

const Header: React.FC = () => {
  return (
    <StyledHeader>
      <HeaderLeft>
        <Logo>FlowMind</Logo>
      </HeaderLeft>
      <HeaderRight>
        <RightButtonGroup />
      </HeaderRight>
    </StyledHeader>
  )
}

export default Header 
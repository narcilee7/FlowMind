/**
 * ThemeSwitcher组件 - 使用styled-components实现
 */

import React, { useState } from 'react'
import styled from 'styled-components'
import { useTheme } from '@/theme/ThemeProvider'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'

export interface ThemeSwitcherProps {
  className?: string
}

const ThemeSwitcherContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
`

const ThemeSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const SectionTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--foreground);
  margin: 0;
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className }) => {
  const { theme, themeType, setTheme, toggleTheme, isDark, isLight } = useTheme()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
  }

  return (
    <ThemeSwitcherContainer className={className}>
      <ThemeSection>
        <SectionTitle>基础主题</SectionTitle>
        <ButtonGroup>
          <Button
            variant={themeType === 'light' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleThemeChange('light')}
          >
            浅色
          </Button>
          <Button
            variant={themeType === 'dark' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleThemeChange('dark')}
          >
            深色
          </Button>
          <Button
            variant={themeType === 'system' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleThemeChange('system')}
          >
            系统
          </Button>
        </ButtonGroup>
      </ThemeSection>

      <ThemeSection>
        <SectionTitle>快速切换</SectionTitle>
        <ButtonGroup>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
          >
            切换主题
          </Button>
        </ButtonGroup>
      </ThemeSection>

      {showAdvanced && (
        <ThemeSection>
          <SectionTitle>主题信息</SectionTitle>
          <Panel variant="bordered" padding="sm">
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
              <div>当前主题: {themeType}</div>
              <div>主题类型: {isDark ? '深色' : isLight ? '浅色' : '系统'}</div>
              <div>主色调: {theme.colors.primary}</div>
            </div>
          </Panel>
        </ThemeSection>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? '隐藏' : '显示'}高级选项
      </Button>
    </ThemeSwitcherContainer>
  )
}

export default ThemeSwitcher 
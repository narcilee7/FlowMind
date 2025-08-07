/**
 * 主题提供者组件
 * 使用styled-components的ThemeProvider提供主题上下文
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { Theme, ThemeType, ThemeManager, GlobalStyle, lightTheme, darkTheme } from './theme'

interface ThemeContextType {
  theme: Theme
  themeType: ThemeType
  setTheme: (type: ThemeType) => void
  toggleTheme: () => void
  isDark: boolean
  isLight: boolean
}

const ThemeContext = createContext<ThemeContextType | null>(null)

interface ThemeProviderProps {
  children: React.ReactNode
  initialTheme?: ThemeType
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme = 'system'
}) => {
  const [theme, setTheme] = useState<Theme>(lightTheme)
  const [themeType, setThemeType] = useState<ThemeType>(initialTheme)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const themeManager = ThemeManager.getInstance()
    
    // 设置初始主题
    if (initialTheme !== 'system') {
      themeManager.setTheme(initialTheme)
    }
    
    // 监听主题变化
    const unsubscribe = themeManager.onThemeChange((newTheme) => {
      setTheme(newTheme)
      setThemeType(themeManager.getThemeType())
    })

    // 初始化当前主题
    setTheme(themeManager.getCurrentTheme())
    setThemeType(themeManager.getThemeType())
    setIsInitialized(true)

    return unsubscribe
  }, [initialTheme])

  const handleSetTheme = (type: ThemeType) => {
    const themeManager = ThemeManager.getInstance()
    themeManager.setTheme(type)
  }

  const handleToggleTheme = () => {
    const themeManager = ThemeManager.getInstance()
    themeManager.toggleTheme()
  }

  const contextValue: ThemeContextType = {
    theme,
    themeType,
    setTheme: handleSetTheme,
    toggleTheme: handleToggleTheme,
    isDark: theme === darkTheme,
    isLight: theme === lightTheme
  }

  if (!isInitialized) {
    return null // 或者显示加载状态
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <StyledThemeProvider theme={theme}>
        <GlobalStyle theme={theme} />
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  )
}

/**
 * 使用主题的Hook
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

/**
 * 主题切换组件
 */
export const ThemeToggle: React.FC = () => {
  const { themeType, toggleTheme, isDark, isLight } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      style={{
        padding: '0.5rem',
        borderRadius: '0.375rem',
        border: '1px solid var(--border)',
        background: 'var(--background)',
        color: 'var(--foreground)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem'
      }}
    >
      {isDark ? '🌙' : '☀️'}
      <span>{themeType === 'system' ? '系统' : isDark ? '深色' : '浅色'}</span>
    </button>
  )
}

export default ThemeProvider 
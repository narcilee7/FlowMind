import { useState, useEffect, useCallback } from 'react'

export type Theme = 'light' | 'dark' | 'system'

/**
 * 主题管理器类
 */
class ThemeManager {
  private static instance: ThemeManager
  private currentTheme: Theme = 'system'
  private listeners: Set<(theme: Theme) => void> = new Set()

  private constructor() {
    this.init()
  }

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager()
    }
    return ThemeManager.instance
  }

  private init() {
    // 从localStorage读取保存的主题
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      this.currentTheme = savedTheme
    }

    // 监听系统主题变化
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', this.handleSystemThemeChange)
    }

    this.applyTheme()
  }

  private handleSystemThemeChange = () => {
    if (this.currentTheme === 'system') {
      this.applyTheme()
      this.notifyListeners()
    }
  }

  private applyTheme() {
    const actualTheme = this.getActualTheme()
    
    // 更新document的class
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(actualTheme)
    }

    // 更新CSS变量
    this.updateCSSVariables(actualTheme)
  }

  private updateCSSVariables(theme: 'light' | 'dark') {
    const root = document.documentElement
    
    if (theme === 'dark') {
      // 深色主题变量
      root.style.setProperty('--background', '222.2 84% 4.9%')
      root.style.setProperty('--foreground', '210 40% 98%')
      root.style.setProperty('--card', '222.2 84% 4.9%')
      root.style.setProperty('--card-foreground', '210 40% 98%')
      root.style.setProperty('--popover', '222.2 84% 4.9%')
      root.style.setProperty('--popover-foreground', '210 40% 98%')
      root.style.setProperty('--primary', '217.2 91.2% 59.8%')
      root.style.setProperty('--primary-foreground', '222.2 84% 4.9%')
      root.style.setProperty('--secondary', '217.2 32.6% 17.5%')
      root.style.setProperty('--secondary-foreground', '210 40% 98%')
      root.style.setProperty('--muted', '217.2 32.6% 17.5%')
      root.style.setProperty('--muted-foreground', '215 20.2% 65.1%')
      root.style.setProperty('--accent', '217.2 32.6% 17.5%')
      root.style.setProperty('--accent-foreground', '210 40% 98%')
      root.style.setProperty('--destructive', '0 62.8% 30.6%')
      root.style.setProperty('--destructive-foreground', '210 40% 98%')
      root.style.setProperty('--border', '217.2 32.6% 17.5%')
      root.style.setProperty('--input', '217.2 32.6% 17.5%')
      root.style.setProperty('--ring', '224.3 76.3% 94.1%')
      root.style.setProperty('--radius', '0.5rem')
      
      // 编辑器专用颜色 - 暗色主题
      root.style.setProperty('--editor-background', '222.2 84% 4.9%')
      root.style.setProperty('--editor-foreground', '210 40% 98%')
      root.style.setProperty('--editor-selection', '217.2 91.2% 59.8%')
      root.style.setProperty('--editor-cursor', '210 40% 98%')
      root.style.setProperty('--editor-line', '217.2 32.6% 17.5%')
      root.style.setProperty('--editor-comment', '215 20.2% 65.1%')
      root.style.setProperty('--editor-string', '142.1 70.6% 45.3%')
      root.style.setProperty('--editor-keyword', '217.2 91.2% 59.8%')
      root.style.setProperty('--editor-function', '262.1 83.3% 57.8%')
      root.style.setProperty('--editor-variable', '210 40% 98%')
      root.style.setProperty('--editor-number', '47.9 95.8% 53.1%')
      root.style.setProperty('--editor-boolean', '262.1 83.3% 57.8%')
      root.style.setProperty('--editor-operator', '210 40% 98%')
      root.style.setProperty('--editor-punctuation', '215 20.2% 65.1%')
      root.style.setProperty('--editor-gutter', '215 20.2% 65.1%')
      root.style.setProperty('--editor-active-line', '217.2 32.6% 17.5%')
      root.style.setProperty('--editor-bracket', '215 20.2% 65.1%')
      root.style.setProperty('--editor-bracket-match', '217.2 91.2% 59.8%')
      
      // 侧边栏专用颜色 - 暗色主题
      root.style.setProperty('--sidebar', '222.2 84% 4.9%')
      root.style.setProperty('--sidebar-foreground', '210 40% 98%')
      root.style.setProperty('--sidebar-primary', '217.2 91.2% 59.8%')
      root.style.setProperty('--sidebar-primary-foreground', '222.2 84% 4.9%')
      root.style.setProperty('--sidebar-accent', '217.2 32.6% 17.5%')
      root.style.setProperty('--sidebar-accent-foreground', '210 40% 98%')
      root.style.setProperty('--sidebar-border', '217.2 32.6% 17.5%')
      root.style.setProperty('--sidebar-ring', '224.3 76.3% 94.1%')
      
      // 图表颜色 - 暗色主题
      root.style.setProperty('--chart-1', '142.1 70.6% 45.3%')
      root.style.setProperty('--chart-2', '217.2 91.2% 59.8%')
      root.style.setProperty('--chart-3', '262.1 83.3% 57.8%')
      root.style.setProperty('--chart-4', '47.9 95.8% 53.1%')
      root.style.setProperty('--chart-5', '0 62.8% 30.6%')
    } else {
      // 浅色主题变量
      root.style.setProperty('--background', '0 0% 100%')
      root.style.setProperty('--foreground', '222.2 84% 4.9%')
      root.style.setProperty('--card', '0 0% 100%')
      root.style.setProperty('--card-foreground', '222.2 84% 4.9%')
      root.style.setProperty('--popover', '0 0% 100%')
      root.style.setProperty('--popover-foreground', '222.2 84% 4.9%')
      root.style.setProperty('--primary', '221.2 83.2% 53.3%')
      root.style.setProperty('--primary-foreground', '210 40% 98%')
      root.style.setProperty('--secondary', '210 40% 96%')
      root.style.setProperty('--secondary-foreground', '222.2 84% 4.9%')
      root.style.setProperty('--muted', '210 40% 96%')
      root.style.setProperty('--muted-foreground', '215.4 16.3% 46.9%')
      root.style.setProperty('--accent', '210 40% 96%')
      root.style.setProperty('--accent-foreground', '222.2 84% 4.9%')
      root.style.setProperty('--destructive', '0 84.2% 60.2%')
      root.style.setProperty('--destructive-foreground', '210 40% 98%')
      root.style.setProperty('--border', '214.3 31.8% 91.4%')
      root.style.setProperty('--input', '214.3 31.8% 91.4%')
      root.style.setProperty('--ring', '221.2 83.2% 53.3%')
      root.style.setProperty('--radius', '0.5rem')
      
      // 编辑器专用颜色 - 浅色主题
      root.style.setProperty('--editor-background', '0 0% 100%')
      root.style.setProperty('--editor-foreground', '222.2 84% 4.9%')
      root.style.setProperty('--editor-selection', '221.2 83.2% 53.3%')
      root.style.setProperty('--editor-cursor', '222.2 84% 4.9%')
      root.style.setProperty('--editor-line', '214.3 31.8% 91.4%')
      root.style.setProperty('--editor-comment', '215.4 16.3% 46.9%')
      root.style.setProperty('--editor-string', '142.1 76.2% 36.3%')
      root.style.setProperty('--editor-keyword', '221.2 83.2% 53.3%')
      root.style.setProperty('--editor-function', '262.1 83.3% 57.8%')
      root.style.setProperty('--editor-variable', '222.2 84% 4.9%')
      root.style.setProperty('--editor-number', '47.9 95.8% 53.1%')
      root.style.setProperty('--editor-boolean', '262.1 83.3% 57.8%')
      root.style.setProperty('--editor-operator', '222.2 84% 4.9%')
      root.style.setProperty('--editor-punctuation', '215.4 16.3% 46.9%')
      root.style.setProperty('--editor-gutter', '215.4 16.3% 46.9%')
      root.style.setProperty('--editor-active-line', '210 40% 96%')
      root.style.setProperty('--editor-bracket', '215.4 16.3% 46.9%')
      root.style.setProperty('--editor-bracket-match', '221.2 83.2% 53.3%')
      
      // 侧边栏专用颜色 - 浅色主题
      root.style.setProperty('--sidebar', '0 0% 100%')
      root.style.setProperty('--sidebar-foreground', '222.2 84% 4.9%')
      root.style.setProperty('--sidebar-primary', '221.2 83.2% 53.3%')
      root.style.setProperty('--sidebar-primary-foreground', '210 40% 98%')
      root.style.setProperty('--sidebar-accent', '210 40% 96%')
      root.style.setProperty('--sidebar-accent-foreground', '222.2 84% 4.9%')
      root.style.setProperty('--sidebar-border', '214.3 31.8% 91.4%')
      root.style.setProperty('--sidebar-ring', '221.2 83.2% 53.3%')
      
      // 图表颜色 - 浅色主题
      root.style.setProperty('--chart-1', '142.1 76.2% 36.3%')
      root.style.setProperty('--chart-2', '221.2 83.2% 53.3%')
      root.style.setProperty('--chart-3', '262.1 83.3% 57.8%')
      root.style.setProperty('--chart-4', '47.9 95.8% 53.1%')
      root.style.setProperty('--chart-5', '0 84.2% 60.2%')
    }
  }

  getTheme(): Theme {
    return this.currentTheme
  }

  getActualTheme(): 'light' | 'dark' {
    if (this.currentTheme === 'system') {
      return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light'
    }
    return this.currentTheme
  }

  setTheme(theme: Theme) {
    this.currentTheme = theme
    localStorage.setItem('theme', theme)
    this.applyTheme()
    this.notifyListeners()
  }

  toggleTheme() {
    const themes: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(this.currentTheme)
    const nextIndex = (currentIndex + 1) % themes.length
    this.setTheme(themes[nextIndex])
  }

  subscribe(listener: (theme: Theme) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentTheme))
  }
}

/**
 * 主题管理hook
 */
export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const manager = ThemeManager.getInstance()
    return manager.getTheme()
  })

  useEffect(() => {
    const manager = ThemeManager.getInstance()
    const unsubscribe = manager.subscribe((newTheme) => {
      setThemeState(newTheme)
    })
    return unsubscribe
  }, [])

  const setTheme = useCallback((newTheme: Theme) => {
    const manager = ThemeManager.getInstance()
    manager.setTheme(newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    const manager = ThemeManager.getInstance()
    manager.toggleTheme()
  }, [])

  const getActualTheme = useCallback((): 'light' | 'dark' => {
    const manager = ThemeManager.getInstance()
    return manager.getActualTheme()
  }, [])

  return {
    // 基础主题
    theme,
    setTheme,
    toggleTheme,
    getActualTheme,
    
    // 计算属性
    isDark: getActualTheme() === 'dark',
    isLight: getActualTheme() === 'light',
    isSystem: theme === 'system',
    
    // 可用主题
    availableThemes: ['light', 'dark', 'system'] as const,
    
    // 编辑器主题相关
    editorTheme: getActualTheme(),
    setEditorTheme: (editorTheme: 'light' | 'dark') => {
      const newTheme = editorTheme === 'dark' ? 'dark' : 'light'
      setTheme(newTheme)
    }
  }
}

export default useTheme
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
      // 深色主题变量（极简灰阶风格）
      root.style.setProperty('--background', '0 0% 10%')
      root.style.setProperty('--foreground', '0 0% 98%')
      root.style.setProperty('--card', '0 0% 15%')
      root.style.setProperty('--card-foreground', '0 0% 98%')
      root.style.setProperty('--popover', '0 0% 15%')
      root.style.setProperty('--popover-foreground', '0 0% 98%')
      root.style.setProperty('--primary', '0 0% 15%')
      root.style.setProperty('--primary-foreground', '0 0% 98%')
      root.style.setProperty('--secondary', '0 0% 25%')
      root.style.setProperty('--secondary-foreground', '0 0% 98%')
      root.style.setProperty('--muted', '0 0% 25%')
      root.style.setProperty('--muted-foreground', '0 0% 50%')
      root.style.setProperty('--accent', '0 0% 25%')
      root.style.setProperty('--accent-foreground', '0 0% 98%')
      root.style.setProperty('--destructive', '0 65% 45%')
      root.style.setProperty('--destructive-foreground', '0 0% 98%')
      root.style.setProperty('--border', '0 0% 25%')
      root.style.setProperty('--input', '0 0% 25%')
      root.style.setProperty('--ring', '0 0% 98%')
      root.style.setProperty('--radius', '0.5rem')
  
      // 编辑器专用颜色 - 暗色主题
      root.style.setProperty('--editor-background', '0 0% 10%')
      root.style.setProperty('--editor-foreground', '0 0% 98%')
      root.style.setProperty('--editor-selection', '210 16% 90%')
      root.style.setProperty('--editor-cursor', '0 0% 20%')
      root.style.setProperty('--editor-line', '0 0% 15%')
      root.style.setProperty('--editor-comment', '0 0% 55%')
      root.style.setProperty('--editor-string', '140 10% 30%')
      root.style.setProperty('--editor-keyword', '220 15% 25%')
      root.style.setProperty('--editor-function', '200 15% 20%')
      root.style.setProperty('--editor-variable', '0 0% 20%')
      root.style.setProperty('--editor-number', '15 20% 25%')
      root.style.setProperty('--editor-boolean', '0 40% 35%')
      root.style.setProperty('--editor-operator', '0 0% 25%')
      root.style.setProperty('--editor-punctuation', '0 0% 40%')
      root.style.setProperty('--editor-gutter', '0 0% 82%')
      root.style.setProperty('--editor-active-line', '0 0% 95%')
      root.style.setProperty('--editor-bracket', '0 0% 30%')
      root.style.setProperty('--editor-bracket-match', '0 0% 70%')
  
      // 侧边栏专用颜色 - 暗色主题
      root.style.setProperty('--sidebar', '0 0% 15%')
      root.style.setProperty('--sidebar-foreground', '0 0% 98%')
      root.style.setProperty('--sidebar-primary', '0 0% 15%')
      root.style.setProperty('--sidebar-primary-foreground', '0 0% 98%')
      root.style.setProperty('--sidebar-accent', '0 0% 25%')
      root.style.setProperty('--sidebar-accent-foreground', '0 0% 98%')
      root.style.setProperty('--sidebar-border', '0 0% 25%')
      root.style.setProperty('--sidebar-ring', '0 0% 98%')
  
      // 图表颜色 - 暗色主题
      root.style.setProperty('--chart-1', '0 0% 40%')
      root.style.setProperty('--chart-2', '0 0% 50%')
      root.style.setProperty('--chart-3', '0 0% 60%')
      root.style.setProperty('--chart-4', '0 0% 70%')
      root.style.setProperty('--chart-5', '0 0% 80%')
    } else {
      // 浅色主题变量（极简灰阶风格）
      root.style.setProperty('--background', '0 0% 98%')
      root.style.setProperty('--foreground', '0 0% 10%')
      root.style.setProperty('--card', '0 0% 100%')
      root.style.setProperty('--card-foreground', '0 0% 10%')
      root.style.setProperty('--popover', '0 0% 100%')
      root.style.setProperty('--popover-foreground', '0 0% 10%')
      root.style.setProperty('--primary', '0 0% 15%')
      root.style.setProperty('--primary-foreground', '0 0% 98%')
      root.style.setProperty('--secondary', '0 0% 25%')
      root.style.setProperty('--secondary-foreground', '0 0% 10%')
      root.style.setProperty('--muted', '0 0% 25%')
      root.style.setProperty('--muted-foreground', '0 0% 50%')
      root.style.setProperty('--accent', '0 0% 25%')
      root.style.setProperty('--accent-foreground', '0 0% 10%')
      root.style.setProperty('--destructive', '0 65% 45%')
      root.style.setProperty('--destructive-foreground', '0 0% 98%')
      root.style.setProperty('--border', '0 0% 85%')
      root.style.setProperty('--input', '0 0% 85%')
      root.style.setProperty('--ring', '0 0% 15%')
      root.style.setProperty('--radius', '0.5rem')
  
      // 编辑器专用颜色 - 浅色主题
      root.style.setProperty('--editor-background', '0 0% 98%')
      root.style.setProperty('--editor-foreground', '0 0% 15%')
      root.style.setProperty('--editor-selection', '210 16% 90%')
      root.style.setProperty('--editor-cursor', '0 0% 20%')
      root.style.setProperty('--editor-line', '0 0% 90%')
      root.style.setProperty('--editor-comment', '0 0% 55%')
      root.style.setProperty('--editor-string', '140 10% 30%')
      root.style.setProperty('--editor-keyword', '220 15% 25%')
      root.style.setProperty('--editor-function', '200 15% 20%')
      root.style.setProperty('--editor-variable', '0 0% 20%')
      root.style.setProperty('--editor-number', '15 20% 25%')
      root.style.setProperty('--editor-boolean', '0 40% 35%')
      root.style.setProperty('--editor-operator', '0 0% 25%')
      root.style.setProperty('--editor-punctuation', '0 0% 40%')
      root.style.setProperty('--editor-gutter', '0 0% 82%')
      root.style.setProperty('--editor-active-line', '0 0% 95%')
      root.style.setProperty('--editor-bracket', '0 0% 30%')
      root.style.setProperty('--editor-bracket-match', '0 0% 70%')
  
      // 侧边栏专用颜色 - 浅色主题
      root.style.setProperty('--sidebar', '0 0% 96%')
      root.style.setProperty('--sidebar-foreground', '0 0% 15%')
      root.style.setProperty('--sidebar-primary', '0 0% 15%')
      root.style.setProperty('--sidebar-primary-foreground', '0 0% 98%')
      root.style.setProperty('--sidebar-accent', '0 0% 25%')
      root.style.setProperty('--sidebar-accent-foreground', '0 0% 15%')
      root.style.setProperty('--sidebar-border', '0 0% 85%')
      root.style.setProperty('--sidebar-ring', '0 0% 15%')
  
      // 图表颜色 - 浅色主题
      root.style.setProperty('--chart-1', '0 0% 40%')
      root.style.setProperty('--chart-2', '0 0% 50%')
      root.style.setProperty('--chart-3', '0 0% 60%')
      root.style.setProperty('--chart-4', '0 0% 70%')
      root.style.setProperty('--chart-5', '0 0% 80%')
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
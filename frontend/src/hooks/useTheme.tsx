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
      root.style.setProperty('--background', 'hsl(222.2 84% 4.9%)')
      root.style.setProperty('--foreground', 'hsl(210 40% 98%)')
      root.style.setProperty('--card', 'hsl(222.2 84% 4.9%)')
      root.style.setProperty('--card-foreground', 'hsl(210 40% 98%)')
      root.style.setProperty('--popover', 'hsl(222.2 84% 4.9%)')
      root.style.setProperty('--popover-foreground', 'hsl(210 40% 98%)')
      root.style.setProperty('--primary', 'hsl(210 40% 98%)')
      root.style.setProperty('--primary-foreground', 'hsl(222.2 84% 4.9%)')
      root.style.setProperty('--secondary', 'hsl(217.2 32.6% 17.5%)')
      root.style.setProperty('--secondary-foreground', 'hsl(210 40% 98%)')
      root.style.setProperty('--muted', 'hsl(217.2 32.6% 17.5%)')
      root.style.setProperty('--muted-foreground', 'hsl(215 20.2% 65.1%)')
      root.style.setProperty('--accent', 'hsl(217.2 32.6% 17.5%)')
      root.style.setProperty('--accent-foreground', 'hsl(210 40% 98%)')
      root.style.setProperty('--destructive', 'hsl(0 62.8% 30.6%)')
      root.style.setProperty('--destructive-foreground', 'hsl(210 40% 98%)')
      root.style.setProperty('--border', 'hsl(217.2 32.6% 17.5%)')
      root.style.setProperty('--input', 'hsl(217.2 32.6% 17.5%)')
      root.style.setProperty('--ring', 'hsl(212.7 26.8% 83.9%)')
      root.style.setProperty('--radius', '0.5rem')
    } else {
      // 浅色主题变量
      root.style.setProperty('--background', 'hsl(0 0% 100%)')
      root.style.setProperty('--foreground', 'hsl(222.2 84% 4.9%)')
      root.style.setProperty('--card', 'hsl(0 0% 100%)')
      root.style.setProperty('--card-foreground', 'hsl(222.2 84% 4.9%)')
      root.style.setProperty('--popover', 'hsl(0 0% 100%)')
      root.style.setProperty('--popover-foreground', 'hsl(222.2 84% 4.9%)')
      root.style.setProperty('--primary', 'hsl(222.2 47.4% 11.2%)')
      root.style.setProperty('--primary-foreground', 'hsl(210 40% 98%)')
      root.style.setProperty('--secondary', 'hsl(210 40% 96%)')
      root.style.setProperty('--secondary-foreground', 'hsl(222.2 84% 4.9%)')
      root.style.setProperty('--muted', 'hsl(210 40% 96%)')
      root.style.setProperty('--muted-foreground', 'hsl(215.4 16.3% 46.9%)')
      root.style.setProperty('--accent', 'hsl(210 40% 96%)')
      root.style.setProperty('--accent-foreground', 'hsl(222.2 84% 4.9%)')
      root.style.setProperty('--destructive', 'hsl(0 84.2% 60.2%)')
      root.style.setProperty('--destructive-foreground', 'hsl(210 40% 98%)')
      root.style.setProperty('--border', 'hsl(214.3 31.8% 91.4%)')
      root.style.setProperty('--input', 'hsl(214.3 31.8% 91.4%)')
      root.style.setProperty('--ring', 'hsl(222.2 84% 4.9%)')
      root.style.setProperty('--radius', '0.5rem')
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
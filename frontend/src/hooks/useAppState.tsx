import { useAppStore } from '@/stores/app-store'

export type Theme = 'light' | 'dark' | 'system'

/**
 * 统一的应用状态管理hook
 * 提供与Zustand store的兼容接口
 */
export const useAppState = () => {
  const store = useAppStore()

  return {
    // 主题相关
    theme: store.theme || 'system',
    setTheme: store.setTheme || (() => {}),
    setEditorTheme: (theme: string) => store.updateEditorSettings({ theme: theme as any }),
    currentTheme: { type: store.theme || 'system' },
    availableThemes: ['light', 'dark', 'system'],
    themeManager: store.themeManager,
    
    // 侧边栏相关
    sidebarCollapsed: store.sidebarCollapsed || false,
    toggleSidebar: store.toggleSidebar || (() => {}),
    
    // 文档相关
    currentDocument: store.currentDocument || null,
    setCurrentDocument: store.setCurrentDocument || (() => {}),
    
    // 编辑器设置
    editorSettings: store.editorSettings || {
      fontSize: 16,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: 1.6,
      wordWrap: true,
    },
    updateEditorSettings: store.updateEditorSettings || (() => {}),
    
    // 网络状态
    isOnline: store.isOnline ?? navigator.onLine,
    setIsOnline: store.setIsOnline || (() => {}),
    
    // 用户信息
    user: store.user || null,
    setUser: store.setUser || (() => {}),
  }
}

/**
 * 主题专用hook
 */
export const useTheme = () => {
  const { 
    theme, 
    setTheme, 
    setEditorTheme,
    currentTheme,
    availableThemes,
    themeManager
  } = useAppState()

  // 获取当前实际主题（考虑system模式）
  const getCurrentTheme = (): 'light' | 'dark' => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  }

  return {
    // 基础主题
    theme,
    setTheme,
    getCurrentTheme,
    
    // 编辑器主题
    setEditorTheme,
    currentTheme,
    availableThemes,
    themeManager,
    
    // 兼容旧的API
    isDark: getCurrentTheme() === 'dark',
    isLight: getCurrentTheme() === 'light',
  }
}

export default useTheme 
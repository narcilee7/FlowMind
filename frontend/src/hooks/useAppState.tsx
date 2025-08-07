import { useAppStore } from 'src/stores/app-store'
import { useTheme } from './useTheme'

export type Theme = 'light' | 'dark' | 'system'

/**
 * 统一的应用状态管理hook
 * 提供与Zustand store的兼容接口
 */
export const useAppState = () => {
  const store = useAppStore()
  const themeHook = useTheme()

  return {
    // 主题相关
    theme: themeHook.theme,
    setTheme: themeHook.setTheme,
    setEditorTheme: themeHook.setEditorTheme,
    currentTheme: { type: themeHook.theme },
    availableThemes: themeHook.availableThemes,
    themeManager: themeHook,
    // 沉浸式
    immersive: store.immersive || false,
    setImmersive: store.setImmersive || (() => {}),
    
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

export default useAppState 
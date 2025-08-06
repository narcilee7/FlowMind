import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'
import { UserModel } from '@/model/userModel'
import { create } from 'zustand'
import { ThemeManager } from '@/theme/theme'

export type Theme = 'light' | 'dark' | 'system'

interface AppState {
  // 主题管理器
  themeManager: ThemeManager
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  
  // 侧边栏状态
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  
  // 当前文档
  currentDocument: string | null
  setCurrentDocument: (path: string | null) => void
  
  // 编辑器设置
  editorSettings: {
    type: EditorType
    sceneTemplate: SceneTemplate
    theme: 'light' | 'dark' | 'auto'
  }
  updateEditorSettings: (settings: Partial<AppState['editorSettings']>) => void
  
  // 网络状态
  isOnline: boolean
  setIsOnline: (online: boolean) => void
  
  // 用户信息
  user: UserModel | null
  setUser: (user: AppState['user']) => void
}

export const useAppStore = create<AppState>((set, get) => {
  // 获取主题管理器单例
  const themeManager = ThemeManager.getInstance()
  
  return {
    // 主题管理器
    themeManager,
    theme: themeManager.getThemeType(),
    setTheme: (theme) => {
      themeManager.setTheme(theme)
      set({ theme })
    },
    toggleTheme: () => {
      themeManager.toggleTheme()
      set({ theme: themeManager.getThemeType() })
    },
    
    // 侧边栏状态
    sidebarCollapsed: false,
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    
    // 当前文档
    currentDocument: null,
    setCurrentDocument: (path) => set({ currentDocument: path }),
    
    // 编辑器设置
    editorSettings: {
      type: EditorType.RICH_TEXT,
      sceneTemplate: SceneTemplate.WRITING,
      theme: 'auto'
    },
    updateEditorSettings: (settings) => 
      set((state) => ({ 
        editorSettings: { ...state.editorSettings, ...settings } 
      })),
    
    // 网络状态
    isOnline: navigator.onLine,
    setIsOnline: (online) => set({ isOnline: online }),
    
    // 用户信息
    user: null,
    setUser: (user) => set({ user })
  }
}) 
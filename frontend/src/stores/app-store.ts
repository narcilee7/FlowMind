import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'
import { UserModel } from '@/model/userModel'
import { create } from 'zustand'
import { useTheme } from '@/hooks/useTheme'

export type Theme = 'light' | 'dark' | 'system'

interface AppState {
  // 主题相关
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void

  // 体验状态: 沉浸式
  /**
   * 沉浸式：只保留editor, sidebar、header、footer都不展示
   */
  immersive: boolean
  setImmersive: (immersive: boolean) => void
  
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
  return {
    // 主题相关 - 使用新的useTheme hook
    theme: 'system',
    setTheme: (theme) => {
      const themeHook = useTheme()
      themeHook.setTheme(theme)
      set({ theme })
    },
    toggleTheme: () => {
      const themeHook = useTheme()
      themeHook.toggleTheme()
      set({ theme: themeHook.theme })
    },
    
    // 体验状态: 沉浸式
    immersive: false,
    setImmersive: (immersive) => set({ immersive }),
    
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
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  // 主题设置
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  // 侧边栏状态
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  
  // 当前文档
  currentDocument: string | null
  setCurrentDocument: (path: string | null) => void
  
  // 编辑器设置
  editorSettings: {
    fontSize: number
    fontFamily: string
    lineHeight: number
    wordWrap: boolean
  }
  updateEditorSettings: (settings: Partial<AppState['editorSettings']>) => void
  
  // 网络状态
  isOnline: boolean
  setIsOnline: (online: boolean) => void
  
  // 用户信息
  user: {
    id: string | null
    name: string | null
    email: string | null
    subscription: 'free' | 'pro' | null
  } | null
  setUser: (user: AppState['user']) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 主题设置
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      
      // 侧边栏状态
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      // 当前文档
      currentDocument: null,
      setCurrentDocument: (path) => set({ currentDocument: path }),
      
      // 编辑器设置
      editorSettings: {
        fontSize: 14,
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
        lineHeight: 1.5,
        wordWrap: true,
      },
      updateEditorSettings: (settings) => set((state) => ({
        editorSettings: { ...state.editorSettings, ...settings }
      })),
      
      // 网络状态
      isOnline: navigator.onLine,
      setIsOnline: (online) => set({ isOnline: online }),
      
      // 用户信息
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: 'flowmind-app-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        editorSettings: state.editorSettings,
        user: state.user,
      }),
    }
  )
)

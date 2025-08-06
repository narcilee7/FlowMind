import { EditorOptions } from '@/components/Editor'
import { UserModel } from '@/model/userModel'
import { create } from 'zustand'

export type Theme = 'light' | 'dark' | 'system'

interface AppState {
  // 主题设置
  theme: Theme
  setTheme: (theme: Theme) => void
  initializeTheme: () => void
  
  // 侧边栏状态
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  
  // 当前文档
  currentDocument: string | null
  setCurrentDocument: (path: string | null) => void
  
  // 编辑器设置
  editorSettings: EditorOptions
  updateEditorSettings: (settings: Partial<AppState['editorSettings']>) => void
  
  // 网络状态
  isOnline: boolean
  setIsOnline: (online: boolean) => void
  
  // 用户信息
  user: UserModel | null
  setUser: (user: AppState['user']) => void
}

// 简化的store，暂时不使用persist中间件
export const useAppStore = create<AppState>((set, get) => ({
  // 主题设置
  theme: 'system',
  setTheme: (theme) => {
    set({ theme })
    // 立即应用主题
    const root = document.documentElement
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  },
  initializeTheme: () => {
    const { theme } = get()
    const root = document.documentElement
    
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        if (mediaQuery.matches) {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    
    // 初始化主题
    if (theme === 'dark' || (theme === 'system' && mediaQuery.matches)) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  },
  
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
    fontSize: 16,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    lineHeight: 1.6,
    wordWrap: 'on',
    wordWrapColumn: 80,
    minimap: {
      enabled: true
    },
    lineNumbers: 'on',
    folding: true,
    autoSave: true,
    autoSaveDelay: 1000,
    contextmenu: true,
    mouseWheelZoom: true,
    quickSuggestions: true,
    suggestOnTriggerCharacters: true,
    suggest: {
      enabled: true,
      triggerCharacters: ['.'],
      triggerCharactersRegex: /^\.$/
    },
    automaticLayout: true,
    scrollBeyondLastLine: true,
    padding: {
      top: 10,
      bottom: 10
    },
    value: '',
    language: 'javascript',
    theme: 'vs-dark',
    readonly: false
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
}))

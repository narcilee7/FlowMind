/**
 * 编辑器配置接口
 */

export interface EditorConfig {
  // 基础配置
  defaultLanguage: string
  defaultTheme: string
  defaultFontSize: number
  defaultFontFamily: string
  defaultLineHeight: number
  
  // 功能配置
  enableAutoSave: boolean
  autoSaveDelay: number
  enableWordWrap: boolean
  enableMinimap: boolean
  enableLineNumbers: boolean
  enableFolding: boolean
  
  // 交互配置
  enableContextMenu: boolean
  enableMouseWheelZoom: boolean
  enableQuickSuggestions: boolean
  enableSuggestOnTriggerCharacters: boolean
  
  // 布局配置
  enableAutomaticLayout: boolean
  scrollBeyondLastLine: boolean
  padding: { top: number; bottom: number }
  
  // 插件配置
  defaultPlugins: string[]
  availablePlugins: string[]
  
  // 适配器配置
  defaultAdapter: string
  availableAdapters: string[]
  
  // 快捷键配置
  keybindings: Record<string, string>
  
  // 主题配置
  themes: {
    [key: string]: {
      name: string
      description: string
      isDark: boolean
    }
  }
  
  // 语言配置
  languages: {
    [key: string]: {
      name: string
      extensions: string[]
      mimeType: string
    }
  }
}
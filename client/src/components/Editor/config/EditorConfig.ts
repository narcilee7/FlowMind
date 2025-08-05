// 编辑器配置接口
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

// 默认配置
export const defaultEditorConfig: EditorConfig = {
  // 基础配置
  defaultLanguage: 'markdown',
  defaultTheme: 'flowmind-dark',
  defaultFontSize: 16,
  defaultFontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  defaultLineHeight: 1.6,
  
  // 功能配置
  enableAutoSave: true,
  autoSaveDelay: 1000,
  enableWordWrap: true,
  enableMinimap: false,
  enableLineNumbers: true,
  enableFolding: true,
  
  // 交互配置
  enableContextMenu: true,
  enableMouseWheelZoom: true,
  enableQuickSuggestions: true,
  enableSuggestOnTriggerCharacters: true,
  
  // 布局配置
  enableAutomaticLayout: true,
  scrollBeyondLastLine: false,
  padding: { top: 16, bottom: 16 },
  
  // 插件配置
  defaultPlugins: ['markdown', 'ai-assistant'],
  availablePlugins: ['markdown', 'ai-assistant', 'spell-check', 'git-integration', 'collaboration'],
  
  // 适配器配置
  defaultAdapter: 'monaco',
  availableAdapters: ['monaco', 'codemirror', 'ace'],
  
  // 快捷键配置
  keybindings: {
    'save': 'ctrl+s',
    'bold': 'ctrl+b',
    'italic': 'ctrl+i',
    'code': 'ctrl+k',
    'link': 'ctrl+l',
    'heading1': 'ctrl+1',
    'heading2': 'ctrl+2',
    'heading3': 'ctrl+3',
    'list': 'ctrl+shift+l',
    'quote': 'ctrl+shift+q',
    'hr': 'ctrl+shift+h',
    'table': 'ctrl+shift+t',
    'ai.complete': 'ctrl+shift+space',
    'ai.improve': 'ctrl+shift+i',
    'ai.summarize': 'ctrl+shift+s',
    'ai.translate': 'ctrl+shift+t',
    'ai.format': 'ctrl+shift+f',
    'ai.fixGrammar': 'ctrl+shift+g',
    'ai.expand': 'ctrl+shift+e',
    'ai.rewrite': 'ctrl+shift+r',
    'ai.generateOutline': 'ctrl+shift+o',
    'ai.addExamples': 'ctrl+shift+x',
  },
  
  // 主题配置
  themes: {
    'flowmind-dark': {
      name: 'FlowMind Dark',
      description: '深色主题，适合夜间使用',
      isDark: true
    },
    'flowmind-light': {
      name: 'FlowMind Light',
      description: '浅色主题，适合日间使用',
      isDark: false
    },
    'vs': {
      name: 'Visual Studio',
      description: 'Visual Studio 默认主题',
      isDark: false
    },
    'vs-dark': {
      name: 'Visual Studio Dark',
      description: 'Visual Studio 深色主题',
      isDark: true
    },
    'hc-black': {
      name: 'High Contrast Black',
      description: '高对比度黑色主题',
      isDark: true
    }
  },
  
  // 语言配置
  languages: {
    'markdown': {
      name: 'Markdown',
      extensions: ['.md', '.markdown'],
      mimeType: 'text/markdown'
    },
    'javascript': {
      name: 'JavaScript',
      extensions: ['.js', '.jsx'],
      mimeType: 'text/javascript'
    },
    'typescript': {
      name: 'TypeScript',
      extensions: ['.ts', '.tsx'],
      mimeType: 'text/typescript'
    },
    'json': {
      name: 'JSON',
      extensions: ['.json'],
      mimeType: 'application/json'
    },
    'html': {
      name: 'HTML',
      extensions: ['.html', '.htm'],
      mimeType: 'text/html'
    },
    'css': {
      name: 'CSS',
      extensions: ['.css', '.scss', '.sass', '.less'],
      mimeType: 'text/css'
    },
    'python': {
      name: 'Python',
      extensions: ['.py'],
      mimeType: 'text/x-python'
    },
    'java': {
      name: 'Java',
      extensions: ['.java'],
      mimeType: 'text/x-java-source'
    },
    'cpp': {
      name: 'C++',
      extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.h'],
      mimeType: 'text/x-c++src'
    },
    'csharp': {
      name: 'C#',
      extensions: ['.cs'],
      mimeType: 'text/x-csharp'
    }
  }
}

// 配置管理器
export class EditorConfigManager {
  private static instance: EditorConfigManager
  private config: EditorConfig
  private listeners: Set<(config: EditorConfig) => void> = new Set()

  private constructor() {
    this.config = this.loadConfig()
  }

  static getInstance(): EditorConfigManager {
    if (!EditorConfigManager.instance) {
      EditorConfigManager.instance = new EditorConfigManager()
    }
    return EditorConfigManager.instance
  }

  // 获取配置
  getConfig(): EditorConfig {
    return { ...this.config }
  }

  // 更新配置
  updateConfig(updates: Partial<EditorConfig>): void {
    this.config = { ...this.config, ...updates }
    this.saveConfig()
    this.notifyListeners()
  }

  // 重置配置
  resetConfig(): void {
    this.config = { ...defaultEditorConfig }
    this.saveConfig()
    this.notifyListeners()
  }

  // 获取特定配置项
  get<K extends keyof EditorConfig>(key: K): EditorConfig[K] {
    return this.config[key]
  }

  // 设置特定配置项
  set<K extends keyof EditorConfig>(key: K, value: EditorConfig[K]): void {
    this.config[key] = value
    this.saveConfig()
    this.notifyListeners()
  }

  // 监听配置变化
  subscribe(listener: (config: EditorConfig) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  // 通知监听器
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.config))
  }

  // 加载配置
  private loadConfig(): EditorConfig {
    try {
      const saved = localStorage.getItem('flowmind-editor-config')
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...defaultEditorConfig, ...parsed }
      }
    } catch (error) {
      console.error('Failed to load editor config:', error)
    }
    return { ...defaultEditorConfig }
  }

  // 保存配置
  private saveConfig(): void {
    try {
      localStorage.setItem('flowmind-editor-config', JSON.stringify(this.config))
    } catch (error) {
      console.error('Failed to save editor config:', error)
    }
  }
}

// 导出单例实例
export const editorConfigManager = EditorConfigManager.getInstance() 
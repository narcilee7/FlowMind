import { EditorConfig } from "@/components/Editor/types/EditorConfig";

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
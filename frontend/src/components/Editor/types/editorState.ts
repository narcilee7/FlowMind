/**
 * 编辑器状态
 */

import { EditorType, SceneTemplate, AICapability } from './editorType'

/**
 * 基础编辑器状态
 */
export interface EditorState {
    // 核心状态
    content: string                    // 当前内容
    editorType: EditorType            // 当前编辑器类型
    sceneTemplate: SceneTemplate      // 当前场景模板
    
    // AI相关状态
    aiCapabilities: AICapability[]    // 启用的AI能力
    isAIProcessing: boolean           // AI是否正在处理
    aiSuggestions: AISuggestion[]     // AI建议列表
    
    // 文档状态
    documentId: string                // 文档ID
    version: number                   // 版本号
    lastModified: Date                // 最后修改时间
    isDirty: boolean                  // 是否有未保存的更改
    
    // 目录状态
    tableOfContents: TOCItem[]        // 目录结构
    currentSection: string            // 当前章节ID
    
    // UI状态
    isFullscreen: boolean             // 是否全屏
    sidebarVisible: boolean           // 侧边栏是否可见
    toolbarVisible: boolean           // 工具栏是否可见
    tocVisible: boolean               // 目录是否可见
}

/**
 * 目录项
 */
export interface TOCItem {
    id: string
    title: string
    level: number                     // 标题级别 (1-6)
    children: TOCItem[]
    position: number                  // 在文档中的位置
    isExpanded?: boolean              // 是否展开
}

/**
 * AI建议
 */
export interface AISuggestion {
    id: string
    type: 'content' | 'structure' | 'research' | 'visualization'
    title: string
    description: string
    confidence: number
    action: () => void
}

/**
 * 编辑器配置
 */
export interface EditorConfig {
    // 基础配置
    autoSave: boolean                 // 自动保存
    autoSaveInterval: number          // 自动保存间隔（毫秒）
    
    // AI配置
    enableAI: boolean                 // 是否启用AI
    aiCapabilities: AICapability[]    // 启用的AI能力
    
    // 目录配置
    autoGenerateTOC: boolean          // 自动生成目录
    tocUpdateInterval: number         // 目录更新间隔（毫秒）
    
    // 主题配置
    theme: 'light' | 'dark' | 'auto'  // 主题
    fontSize: number                  // 字体大小
    
    // 快捷键配置
    enableShortcuts: boolean          // 是否启用快捷键
}

/**
 * 编辑器操作
 */
export interface EditorAction {
    type: string
    payload?: any
    timestamp: number
}

/**
 * 编辑器历史记录
 */
export interface EditorHistory {
    actions: EditorAction[]
    currentIndex: number
    maxHistorySize: number
}
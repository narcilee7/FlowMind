import { DocumentAST, Selection } from "./EditorAST";
import { EditorType, SceneTemplate } from "./EditorType";

export interface EditorKitConfig {
  initialType?: EditorType
  sceneTemplate?: SceneTemplate
  autoDetectScene?: boolean

  // 功能开关
  enableAI?: boolean
  enablePerformanceMonitoring?: boolean
  enableErrorHandling?: boolean
  enableAutoSave?: boolean

  // AI配置
  aiConfig?: {
    apiKey?: string
    model?: string
    temperature?: number
    maxTokens?: number
  }

  // 性能配置
  performanceConfig?: {
    enableVirtualScrolling?: boolean
    virtualScrollThreshold?: number
    batchUpdateDelay?: number
  }

  // 样式配置
  theme?: 'light' | 'dark' | 'auto'
  className?: string
  style?: React.CSSProperties

  // 事件回调
  onChange?: (ast: DocumentAST) => void
  onSelectionChange?: (selection: Selection) => void
  onError?: (error: Error) => void
  onReady?: (editor: EditorKitHandle) => void
  onSceneChange?: (newScene: SceneTemplate, oldScene: SceneTemplate) => void
}

/**
 * 编辑器句柄接口
 */
export interface EditorKitHandle {
  // 内容操作
  getContent(): DocumentAST
  setContent(ast: DocumentAST): void
  clear(): void

  // 选择操作
  getSelection(): Selection
  setSelection(selection: Selection): void

  // 编辑器切换
  switchEditor(type: EditorType): Promise<void>
  getRecommendedEditors(): Array<{ type: EditorType; confidence: number; reason: string }>

  // AI功能
  requestAICompletion(context?: string): Promise<string>
  requestAIRewrite(style?: string): Promise<string>
  getAISuggestions(): Promise<string[]>

  // 状态查询
  isReady(): boolean
  getAdapterType(): EditorType
  getSceneTemplate(): SceneTemplate

  // 性能相关
  getPerformanceStats(): any
  getHealthStatus(): any

  // 工具功能
  focus(): void
  blur(): void
  undo(): void
  redo(): void

  // 导出功能
  exportToJSON(): string
  exportToHTML(): Promise<string>
  exportToMarkdown(): Promise<string>
}


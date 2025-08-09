/**
 * 编辑器状态相关
 */

import { DocumentAST } from "./EditorAST"
import { EditorType, SceneTemplate } from "./EditorType"

/**
 * 状态快照
 */
export interface StateSnapshot {
  id: string
  timestamp: number
  ast: DocumentAST
  selection: Selection
  editorType: EditorType
  sceneTemplate: SceneTemplate
  metadata: {
    version: string
    operation: string
    userId?: string
    sessionId: string
  }
}


/**
 * 状态变更事件
 */
export interface StateChangeEvent {
  type: StateChangeEventType
  before: StateSnapshot
  after: StateSnapshot
  operation: string
  timestamp: number
}

/**
 * 状态变更事件类型
 */
export type StateChangeEventType = 'content' | 'selection' | 'editor' | 'scene'

/**
 * 状态协作管理配置
 */
export interface StateManagerConfig {
  // 历史记录最大数量
  maxHistorySize: number
  // 自动保存间隔
  autoSaveInterval: number
  // 协作的功能先不实现
  // enableCollaboration: boolean
  // 是否启用持久化
  enablePersistence: boolean
  // 持久化存储的键
  persistenceKey: string
  // 防抖延迟
  debounceDelay: number
  // 是否启用压缩
  compressionEnabled: boolean
}
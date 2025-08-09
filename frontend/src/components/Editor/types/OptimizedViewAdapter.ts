/**
 * 优化后的适配器接口
 * 
 * 提供更高效的渲染和操作性能
 * 包括渲染优化、内存管理、事件系统等
 * 
 */

import { DocumentAST } from "./EditorAST"

/**
 * 适配器状态枚举
 */
export enum AdapterState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  READY = 'ready',
  UPDATING = 'updating',
  DESTROYING = 'destroying',
  DESTROYED = 'destroyed',
  ERROR = 'error'
}

/**
 * 生命周期钩子
 */
export interface LifecycleHooks {
  beforeCreate?: () => Promise<void>
  created?: () => Promise<void>
  beforeDestroy?: () => Promise<void>
  destroyed?: () => Promise<void>
  beforeUpdate?: (ast: DocumentAST) => Promise<boolean>
  updated?: (ast: DocumentAST) => Promise<void>
}

/**
 * 适配器能力接口
 */
export interface AdapterCapabilities {
  // 是否支持编辑
  readonly canEdit: boolean
  // 是否支持选择
  readonly canSelect: boolean
  // 是否支持缩放
  readonly canZoom: boolean
  // 是否支持拖拽
  readonly canDrag: boolean

  // 是否支持撤销
  readonly supportsUndo: boolean
  // 是否支持搜索
  readonly supportsSearch: boolean
  // 是否支持AI
  readonly supportsAI: boolean
}


/**
 * 事件回调类型映射
 */
export interface AdapterEventMap {
  stateChange: (state: AdapterState) => void
  nodeClick: (data: NodeClickData) => void
  nodeDoubleClick: (data: NodeClickData) => void
  selectionChange: (selection: Selection) => void
  viewChange: (viewData: any) => void
  focus: () => void
  blur: () => void
  error: (error: Error) => void
}

/**
 * Node点击事件数据类型
 */
export type NodeClickData = {
  nodeId: string
  event: MouseEvent
}


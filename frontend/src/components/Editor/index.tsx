/**
 * 编辑器组件主入口 - 基于PRD重构
 */

// 核心组件
export { EditorProvider } from './core/EditorProvider'
export { EditorCore } from './core/EditorCore'
export { default as EditorManager } from './core/EditorManager'
export { default as EditorAdapterFactory } from './core/EditorAdapterFactory'

// 类型定义
export * from './types/EditorType'
export * from './types/EditorState'
export * from './types/EditorAdapter'
export * from './types/EditorContext'

// 适配器
export * from './adapters'

// 插件
// export * from './plugins'

// 工具函数
export { useEditor } from './types/EditorContext'

// 默认导出
export { EditorProvider as default } from './core/EditorProvider'

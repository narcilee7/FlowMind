/**
 * Editor内核接口
 */

import { DocumentAST, Selection } from "./EditorAST"

/**
 * 编辑器内核状态
 */
export enum EditorCoreState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  READY = 'ready',
  ERROR = 'error',
  DESTROYED = 'destroyed'
}

/**
 * 编辑器内核命令暴露接口
 */
export interface EditorCoreCommands {
  // 状态查询
  getState(): EditorCoreState
  isReady(): boolean

  // AST 操作
  getAST(): DocumentAST | null
  setAST(ast: DocumentAST): Promise<void>

  // 选择操作
  getSelection(): Selection | null
  setSelection(selection: Selection): Promise<void>

  // 视图操作
  focus(): void
  blur(): void

  // 错误和性能
  getErrorStats(): any
  getPerformanceStats(): any

  // AI 功能
  requestAICompletion(context: string, position: number): Promise<string>
  getAISuggestions(context?: string): Promise<any[]>

  // 恢复操作
  recover(): Promise<boolean>
  reset(): Promise<void>
}
/**
 * 编辑器适配器索引 - 重构版
 * 只保留核心的TipTap适配器
 */

import { TipTapAdapter } from './TipTapAdapter'
import { EditorType } from '../types/EditorType'
import EditorAdapterFactory from '../core/EditorAdapterFactory'

// 注册TipTap适配器
EditorAdapterFactory.registerAdapter(EditorType.RICH_TEXT, TipTapAdapter)

// 导出适配器
export { TipTapAdapter }

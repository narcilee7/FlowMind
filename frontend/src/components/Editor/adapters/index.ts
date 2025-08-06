/**
 * 编辑器适配器索引
 */

import { RichTextAdapter } from './RichTextAdapter'
import { EditorType } from '../types/editorType'
import EditorAdapterFactory from '../core/EditorAdapterFactory'

// 注册适配器
EditorAdapterFactory.registerAdapter(EditorType.RICH_TEXT, RichTextAdapter)

// 导出适配器
export { RichTextAdapter }

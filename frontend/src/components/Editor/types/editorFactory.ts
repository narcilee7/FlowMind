/**
 * 编辑器工厂接口
 */

import { EditorAdapter } from "./EditorAdapter";

export interface EditorFactory {
    // 创建编辑器适配器
    createAdapter(): EditorAdapter
    // 获取支持的语言
    getSupportedLanguages(): string[]
    // 获取支持的主题
    getSupportedThemes(): string[]
}

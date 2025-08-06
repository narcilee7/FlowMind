import { EditorAdapter, EditorType } from '../types'
// import { MarkdownAdapter } from '../adapters/MarkdownAdapter'
// import { RichTextAdapter } from '../adapters/RichTextAdapter'
// import { CanvasAdapter } from '../adapters/CanvasAdapter'

export default class EditorAdapterFactory {
  private static adapters = new Map<EditorType, new () => EditorAdapter>()

  static createAdapter(type: EditorType): EditorAdapter {
    const AdapterClass = this.adapters.get(type)
    if (!AdapterClass) {
      throw new Error(`Unsupported editor type: ${type}`)
    }
    return new AdapterClass()
  }
  /**
   * 注册编辑器适配器
   * @param type 编辑器类型
   * @param adapterClass 编辑器适配器类实例
   */
  static registerAdapter(type: EditorType, adapterClass: new () => EditorAdapter): void {
    this.adapters.set(type, adapterClass)
  }

  /**
   * 获取支持的编辑器类型
   * @returns 支持的编辑器类型
   */
  static getSupportedTypes(): EditorType[] {
    return Array.from(this.adapters.keys())
  }

  /**
   * 检查是否支持编辑器类型
   * @param type 编辑器类型
   * @returns 是否支持
   */
  static isSupported(type: EditorType): boolean {
    return this.adapters.has(type)
  }

  /**
   * 获取编辑器适配器
   * @param type 编辑器类型
   * @returns 编辑器适配器
   */
  static getAdapter(type: EditorType): EditorAdapter | null {
    const AdapterClass = this.adapters.get(type)
    if (!AdapterClass) {
      return null
    }
    return new AdapterClass()
  }
}
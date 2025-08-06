import { EditorAdapter, EditorType, EditorOptions } from '../types'
import { MarkdownAdapter } from '../adapters/MarkdownAdapter'
import { RichTextAdapter } from '../adapters/RichTextAdapter'
import { CanvasAdapter } from '../adapters/CanvasAdapter'

export class EditorAdapterFactory {
  private static adapters = new Map<EditorType, new () => EditorAdapter>([
    [EditorType.MARKDOWN, MarkdownAdapter],
    [EditorType.RICH_TEXT, RichTextAdapter],
    [EditorType.CANVAS, CanvasAdapter]
  ])

  static createAdapter(type: EditorType): EditorAdapter {
    const AdapterClass = this.adapters.get(type)
    if (!AdapterClass) {
      throw new Error(`Unsupported editor type: ${type}`)
    }
    return new AdapterClass()
  }

  static registerAdapter(type: EditorType, adapterClass: new () => EditorAdapter): void {
    this.adapters.set(type, adapterClass)
  }

  static getSupportedTypes(): EditorType[] {
    return Array.from(this.adapters.keys())
  }

  static isSupported(type: EditorType): boolean {
    return this.adapters.has(type)
  }
}

// 编辑器管理器
export class EditorManager {
  private currentAdapter: EditorAdapter | null = null
  private element: HTMLElement | null = null
  private options: EditorOptions | null = null

  async createEditor(
    element: HTMLElement, 
    type: EditorType, 
    options: EditorOptions
  ): Promise<EditorAdapter> {
    // 销毁当前编辑器
    await this.destroyEditor()

    // 创建新编辑器
    this.element = element
    this.options = options
    this.currentAdapter = EditorAdapterFactory.createAdapter(type)

    await this.currentAdapter.create(element, options)
    return this.currentAdapter
  }

  async switchEditorType(type: EditorType): Promise<EditorAdapter> {
    if (!this.element || !this.options) {
      throw new Error('Editor not initialized')
    }

    return this.createEditor(this.element, type, this.options)
  }

  async destroyEditor(): Promise<void> {
    if (this.currentAdapter) {
      this.currentAdapter.destroy()
      this.currentAdapter = null
    }
  }

  getCurrentAdapter(): EditorAdapter | null {
    return this.currentAdapter
  }

  getCurrentType(): EditorType | null {
    return this.currentAdapter?.type || null
  }
} 
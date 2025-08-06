// 编辑器适配器抽象接口
export interface EditorAdapter {
  // 基础操作
  create(element: HTMLElement, options: EditorOptions): Promise<void>
  destroy(): void
  
  // 内容操作
  getValue(): string
  setValue(value: string): void
  insertText(text: string, position?: Position): void
  replaceSelection(text: string): void
  getSelection(): string
  setSelection(start: Position, end: Position): void
  
  // 光标和选择
  getCursorPosition(): Position
  setCursorPosition(position: Position): void
  getSelectionRange(): SelectionRange | null
  setSelectionRange(range: SelectionRange): void
  
  // 滚动
  getScrollPosition(): ScrollPosition
  setScrollPosition(position: ScrollPosition): void
  scrollToLine(line: number): void
  
  // 配置
  updateOptions(options: Partial<EditorOptions>): void
  getOption<K extends keyof EditorOptions>(key: K): EditorOptions[K]
  
  // 事件监听
  on(event: string, callback: Function): void
  off(event: string, callback: Function): void
  
  // 命令执行
  executeCommand(command: string, ...args: any[]): void
  addCommand(id: string, handler: Function): void
  
  // 焦点控制
  focus(): void
  blur(): void
  isFocused(): boolean
}

// 位置接口
export interface Position {
  line: number
  column: number
}

// 选择范围接口
export interface SelectionRange {
  start: Position
  end: Position
}

// 滚动位置接口
export interface ScrollPosition {
  scrollTop: number
  scrollLeft: number
}

// 编辑器选项接口
export interface EditorOptions {
  // 基础配置
  value: string
  language: string
  theme: string
  readOnly: boolean
  
  // 外观配置
  fontSize: number
  fontFamily: string
  lineHeight: number
  wordWrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded'
  wordWrapColumn: number
  
  // 功能配置
  minimap: { enabled: boolean }
  lineNumbers: 'on' | 'off' | 'relative'
  folding: boolean
  autoSave: boolean
  autoSaveDelay: number
  
  // 交互配置
  contextmenu: boolean
  mouseWheelZoom: boolean
  quickSuggestions: boolean
  suggestOnTriggerCharacters: boolean
  
  // 布局配置
  automaticLayout: boolean
  scrollBeyondLastLine: boolean
  padding: { top: number; bottom: number }
  
  // 扩展配置
  [key: string]: any
}

// 编辑器事件类型
export type EditorEvent = 
  | 'change'
  | 'cursorPositionChanged'
  | 'selectionChanged'
  | 'scrollChanged'
  | 'focus'
  | 'blur'
  | 'keydown'
  | 'keyup'
  | 'mousedown'
  | 'mouseup'
  | 'paste'
  | 'drop'

// 编辑器命令接口
export interface EditorCommand {
  id: string
  handler: Function
  keybinding?: string
  when?: string
}

// 编辑器工厂接口
export interface EditorFactory {
  createAdapter(): EditorAdapter
  getSupportedLanguages(): string[]
  getSupportedThemes(): string[]
}

// 编辑器注册表
export class EditorRegistry {
  private static adapters = new Map<string, EditorFactory>()
  
  static register(name: string, factory: EditorFactory): void {
    this.adapters.set(name, factory)
  }
  
  static get(name: string): EditorFactory | undefined {
    return this.adapters.get(name)
  }
  
  static list(): string[] {
    return Array.from(this.adapters.keys())
  }
  
  static create(name: string): EditorAdapter | null {
    const factory = this.get(name)
    return factory ? factory.createAdapter() : null
  }
} 
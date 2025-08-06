import * as monaco from 'monaco-editor'
import { 
  EditorAdapter, 
  EditorOptions, 
  Position, 
  SelectionRange, 
  ScrollPosition,
  EditorFactory 
} from '../core/EditorAdapter'

// Monaco编辑器适配器实现
export class MonacoAdapter implements EditorAdapter {
  private editor: monaco.editor.IStandaloneCodeEditor | null = null
  private element: HTMLElement | null = null
  private options: EditorOptions
  private eventListeners = new Map<string, Set<Function>>()
  private commands = new Map<string, Function>()

  constructor() {
    this.options = this.getDefaultOptions()
  }

  async create(element: HTMLElement, options: EditorOptions): Promise<void> {
    this.element = element
    this.options = { ...this.getDefaultOptions(), ...options }
    
    // 配置Monaco
    this.configureMonaco()
    
    // 创建编辑器实例
    this.editor = monaco.editor.create(element, this.convertToMonacoOptions(this.options))
    
    // 绑定事件
    this.bindEvents()
    
    // 注册默认命令
    this.registerDefaultCommands()
  }

  destroy(): void {
    if (this.editor) {
      this.editor.dispose()
      this.editor = null
    }
    this.eventListeners.clear()
    this.commands.clear()
  }

  // 内容操作
  getValue(): string {
    return this.editor?.getValue() || ''
  }

  setValue(value: string): void {
    this.editor?.setValue(value)
  }

  insertText(text: string, position?: Position): void {
    if (!this.editor) return
    
    if (position) {
      const monacoPosition = new monaco.Position(position.line, position.column)
      this.editor.executeEdits('insertText', [{
        range: new monaco.Range(position.line, position.column, position.line, position.column),
        text
      }])
    } else {
      const selection = this.editor.getSelection()
      if (selection) {
        this.editor.executeEdits('insertText', [{
          range: selection,
          text
        }])
      }
    }
  }

  replaceSelection(text: string): void {
    if (!this.editor) return
    
    const selection = this.editor.getSelection()
    if (selection) {
      this.editor.executeEdits('replaceSelection', [{
        range: selection,
        text
      }])
    }
  }

  getSelection(): string {
    if (!this.editor) return ''
    
    const selection = this.editor.getSelection()
    if (!selection) return ''
    
    return this.editor.getModel()?.getValueInRange(selection) || ''
  }

  setSelection(start: Position, end: Position): void {
    if (!this.editor) return
    
    const range = new monaco.Range(start.line, start.column, end.line, end.column)
    this.editor.setSelection(range)
  }

  // 光标和选择
  getCursorPosition(): Position {
    if (!this.editor) return { line: 1, column: 1 }
    
    const position = this.editor.getPosition()
    return {
      line: position?.lineNumber || 1,
      column: position?.column || 1
    }
  }

  setCursorPosition(position: Position): void {
    if (!this.editor) return
    
    const monacoPosition = new monaco.Position(position.line, position.column)
    this.editor.setPosition(monacoPosition)
  }

  getSelectionRange(): SelectionRange | null {
    if (!this.editor) return null
    
    const selection = this.editor.getSelection()
    if (!selection) return null
    
    return {
      start: {
        line: selection.startLineNumber,
        column: selection.startColumn
      },
      end: {
        line: selection.endLineNumber,
        column: selection.endColumn
      }
    }
  }

  setSelectionRange(range: SelectionRange): void {
    this.setSelection(range.start, range.end)
  }

  // 滚动
  getScrollPosition(): ScrollPosition {
    if (!this.editor) return { scrollTop: 0, scrollLeft: 0 }
    
    // Monaco编辑器没有直接的getScrollPosition方法，返回默认值
    return { scrollTop: 0, scrollLeft: 0 }
  }

  setScrollPosition(position: ScrollPosition): void {
    if (!this.editor) return
    
    this.editor.setScrollPosition({
      scrollTop: position.scrollTop,
      scrollLeft: position.scrollLeft
    })
  }

  scrollToLine(line: number): void {
    if (!this.editor) return
    
    this.editor.revealLine(line)
  }

  // 配置
  updateOptions(options: Partial<EditorOptions>): void {
    this.options = { ...this.options, ...options }
    if (this.editor) {
      this.editor.updateOptions(this.convertToMonacoOptions(this.options))
    }
  }

  getOption<K extends keyof EditorOptions>(key: K): EditorOptions[K] {
    return this.options[key]
  }

  // 事件监听
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(callback)
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  // 命令执行
  executeCommand(command: string, ...args: any[]): void {
    const handler = this.commands.get(command)
    if (handler) {
      handler(...args)
    }
  }

  addCommand(id: string, handler: Function): void {
    this.commands.set(id, handler)
  }

  // 焦点控制
  focus(): void {
    this.editor?.focus()
  }

  blur(): void {
    // Monaco编辑器没有blur方法，通过失去焦点来实现
    this.editor?.getDomNode()?.blur()
  }

  isFocused(): boolean {
    return this.editor?.hasTextFocus() || false
  }

  // 私有方法
  private getDefaultOptions(): EditorOptions {
    return {
      value: '',
      language: 'markdown',
      theme: 'flowmind-dark',
      readOnly: false,
      fontSize: 16,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: 1.6,
      wordWrap: 'on',
      wordWrapColumn: 80,
      minimap: { enabled: false },
      lineNumbers: 'on',
      folding: true,
      autoSave: true,
      autoSaveDelay: 1000,
      contextmenu: true,
      mouseWheelZoom: true,
      quickSuggestions: true,
      suggestOnTriggerCharacters: true,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      padding: { top: 16, bottom: 16 }
    }
  }

  private configureMonaco(): void {
    // 配置Markdown语言
    monaco.languages.register({ id: 'markdown' })
    
    // 配置Markdown语法高亮
    monaco.languages.setMonarchTokensProvider('markdown', {
      defaultToken: '',
      tokenizer: {
        root: [
          [/^(#{1,6})\s+(.+)$/, 'heading'],
          [/\*\*(.+?)\*\*/, 'strong'],
          [/\*(.+?)\*/, 'emphasis'],
          [/```[\s\S]*?```/, 'code'],
          [/`([^`]+)`/, 'code'],
          [/\[([^\]]+)\]\(([^)]+)\)/, 'link'],
          [/^(\s*)([-*+]|\d+\.)\s/, 'list'],
          [/^>\s+(.+)$/, 'quote'],
          [/^---+$/, 'hr'],
          [/\|(.+)\|/, 'table'],
        ]
      }
    })

    // 配置主题
    this.configureThemes()
  }

  private configureThemes(): void {
    monaco.editor.defineTheme('flowmind-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'heading', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'strong', foreground: 'DCDCAA', fontStyle: 'bold' },
        { token: 'emphasis', foreground: 'DCDCAA', fontStyle: 'italic' },
        { token: 'code', foreground: '4EC9B0', background: '1E1E1E' },
        { token: 'link', foreground: '4EC9B0' },
        { token: 'list', foreground: 'C586C0' },
        { token: 'quote', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'hr', foreground: '569CD6' },
        { token: 'table', foreground: '9CDCFE' },
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editor.lineHighlightBackground': '#2A2A2A',
        'editor.selectionBackground': '#264F78',
        'editor.inactiveSelectionBackground': '#3A3D41',
      }
    })

    monaco.editor.defineTheme('flowmind-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'heading', foreground: '0000FF', fontStyle: 'bold' },
        { token: 'strong', foreground: '000000', fontStyle: 'bold' },
        { token: 'emphasis', foreground: '000000', fontStyle: 'italic' },
        { token: 'code', foreground: 'A31515', background: 'F3F3F3' },
        { token: 'link', foreground: '0000FF' },
        { token: 'list', foreground: '795E26' },
        { token: 'quote', foreground: '008000', fontStyle: 'italic' },
        { token: 'hr', foreground: '0000FF' },
        { token: 'table', foreground: '001080' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#000000',
        'editor.lineHighlightBackground': '#F7F7F7',
        'editor.selectionBackground': '#ADD6FF',
        'editor.inactiveSelectionBackground': '#E5EBF1',
      }
    })
  }

  private convertToMonacoOptions(options: EditorOptions): monaco.editor.IStandaloneEditorConstructionOptions {
    return {
      value: options.value,
      language: options.language,
      theme: options.theme,
      readOnly: options.readOnly,
      fontSize: options.fontSize,
      fontFamily: options.fontFamily,
      lineHeight: options.lineHeight * 16,
      wordWrap: options.wordWrap,
      wordWrapColumn: options.wordWrapColumn,
      minimap: options.minimap,
      lineNumbers: options.lineNumbers,
      folding: options.folding,
      contextmenu: options.contextmenu,
      mouseWheelZoom: options.mouseWheelZoom,
      quickSuggestions: {
        other: options.quickSuggestions,
        comments: options.quickSuggestions,
        strings: options.quickSuggestions
      },
      suggestOnTriggerCharacters: options.suggestOnTriggerCharacters,
      automaticLayout: options.automaticLayout,
      scrollBeyondLastLine: options.scrollBeyondLastLine,
      padding: options.padding,
      renderWhitespace: 'none',
      glyphMargin: true,
      foldingStrategy: 'indentation',
      showFoldingControls: 'always',
      selectOnLineNumbers: true,
      roundedSelection: false,
      cursorStyle: 'line',
      lightbulb: { enabled: 'on' as any },
      parameterHints: { enabled: true },
      hover: { enabled: true },
      links: true,
      colorDecorators: true,
    }
  }

  private bindEvents(): void {
    if (!this.editor) return

    // 内容变化
    this.editor.onDidChangeModelContent(() => {
      this.emit('change', this.getValue())
    })

    // 光标位置变化
    this.editor.onDidChangeCursorPosition(() => {
      this.emit('cursorPositionChanged', this.getCursorPosition())
    })

    // 选择变化
    this.editor.onDidChangeCursorSelection(() => {
      this.emit('selectionChanged', this.getSelectionRange())
    })

    // 滚动变化
    this.editor.onDidScrollChange(() => {
      this.emit('scrollChanged', this.getScrollPosition())
    })

    // 焦点事件
    this.editor.onDidFocusEditorWidget(() => {
      this.emit('focus')
    })

    this.editor.onDidBlurEditorWidget(() => {
      this.emit('blur')
    })

    // 键盘事件
    this.editor.onKeyDown((e) => {
      this.emit('keydown', e)
    })

    this.editor.onKeyUp((e) => {
      this.emit('keyup', e)
    })
  }

  private registerDefaultCommands(): void {
    if (!this.editor) return

    // 加粗命令
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      this.executeCommand('bold')
    })

    // 斜体命令
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
      this.executeCommand('italic')
    })

    // 保存命令
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      this.executeCommand('save')
    })
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }
}

// Monaco编辑器工厂
export class MonacoFactory implements EditorFactory {
  createAdapter(): EditorAdapter {
    return new MonacoAdapter()
  }

  getSupportedLanguages(): string[] {
    return ['markdown', 'javascript', 'typescript', 'json', 'html', 'css', 'python', 'java', 'cpp', 'csharp']
  }

  getSupportedThemes(): string[] {
    return ['flowmind-dark', 'flowmind-light', 'vs', 'vs-dark', 'hc-black']
  }
}

// 注册Monaco适配器
// EditorRegistry.register('monaco', new MonacoFactory()) 
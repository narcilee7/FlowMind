import { EditorAdapter, EditorOptions, PositionSection } from '../types'

export class MarkdownAdapter implements EditorAdapter {
  type = 'markdown' as const
  private editor: any = null
  private element: HTMLElement | null = null
  private eventListeners: Map<string, Function[]> = new Map()

  async create(element: HTMLElement, options: EditorOptions): Promise<void> {
    this.element = element
    
    // 使用更适合Markdown的编辑器引擎
    // 这里可以选择：ProseMirror、Slate、Tiptap等
    // 暂时使用简单的textarea实现，后续可以替换为更强大的引擎
    
    this.editor = document.createElement('textarea')
    this.editor.className = 'markdown-editor'
    this.editor.value = options.value || ''
    this.editor.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
      resize: none;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 14px;
      line-height: 1.6;
      padding: 16px;
      background: transparent;
      color: inherit;
    `
    
    element.appendChild(this.editor)
    
    // 绑定事件
    this.bindEvents()
    
    // 应用配置
    this.applyOptions(options)
  }

  destroy(): void {
    if (this.editor && this.element) {
      this.element.removeChild(this.editor)
      this.editor = null
      this.element = null
    }
    this.eventListeners.clear()
  }

  getValue(): string {
    return this.editor?.value || ''
  }

  setValue(value: string): void {
    if (this.editor) {
      this.editor.value = value
    }
  }

  insertText(text: string, position?: PositionSection): void {
    if (!this.editor) return
    
    const start = this.editor.selectionStart
    const end = this.editor.selectionEnd
    
    if (position) {
      // 计算位置
      const lines = this.editor.value.split('\n')
      let offset = 0
      for (let i = 0; i < position.line - 1; i++) {
        offset += lines[i].length + 1
      }
      offset += position.column - 1
      
      this.editor.setSelectionRange(offset, offset)
    }
    
    this.editor.setRange(text, { anchor: start, head: end })
    this.emit('change', this.editor.value)
  }

  replaceSelection(text: string): void {
    if (!this.editor) return
    
    const start = this.editor.selectionStart
    const end = this.editor.selectionEnd
    
    this.editor.value = 
      this.editor.value.substring(0, start) + 
      text + 
      this.editor.value.substring(end)
    
    this.editor.setSelectionRange(start, start + text.length)
    this.emit('change', this.editor.value)
  }

  getSelection(): string {
    if (!this.editor) return ''
    
    const start = this.editor.selectionStart
    const end = this.editor.selectionEnd
    
    return this.editor.value.substring(start, end)
  }

  setSelection(start: PositionSection, end: PositionSection): void {
    if (!this.editor) return
    
    const lines = this.editor.value.split('\n')
    let startOffset = 0
    let endOffset = 0
    
    for (let i = 0; i < start.line - 1; i++) {
      startOffset += lines[i].length + 1
    }
    startOffset += start.column - 1
    
    for (let i = 0; i < end.line - 1; i++) {
      endOffset += lines[i].length + 1
    }
    endOffset += end.column - 1
    
    this.editor.setSelectionRange(startOffset, endOffset)
  }

  focus(): void {
    this.editor?.focus()
  }

  blur(): void {
    this.editor?.blur()
  }

  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private bindEvents(): void {
    if (!this.editor) return
    
    this.editor.addEventListener('input', () => {
      this.emit('change', this.editor.value)
    })
    
    this.editor.addEventListener('keydown', (e: KeyboardEvent) => {
      this.emit('keydown', e)
    })
    
    this.editor.addEventListener('keyup', (e: KeyboardEvent) => {
      this.emit('keyup', e)
    })
    
    this.editor.addEventListener('focus', () => {
      this.emit('focus')
    })
    
    this.editor.addEventListener('blur', () => {
      this.emit('blur')
    })
    
    this.editor.addEventListener('scroll', () => {
      this.emit('scroll', {
        scrollTop: this.editor.scrollTop,
        scrollLeft: this.editor.scrollLeft
      })
    })
  }

  private applyOptions(options: EditorOptions): void {
    if (!this.editor) return
    
    // 应用Markdown特定配置
    if (options.markdownOptions) {
      const mdOptions = options.markdownOptions
      
      if (mdOptions.wordWrap !== undefined) {
        this.editor.style.whiteSpace = mdOptions.wordWrap ? 'pre-wrap' : 'pre'
      }
      
      if (mdOptions.showLineNumbers !== undefined) {
        // 这里可以实现行号显示逻辑
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }
} 
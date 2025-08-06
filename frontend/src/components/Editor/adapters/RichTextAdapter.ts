import { EditorAdapter, EditorOptions, EditorType, PositionSection } from '../types'

export class RichTextAdapter implements EditorAdapter {
  type = EditorType.RICH_TEXT
  private editor: any = null
  private element: HTMLElement | null = null
  private eventListeners: Map<string, Function[]> = new Map()
  private blocks: any[] = []

  async create(element: HTMLElement, options: EditorOptions): Promise<void> {
    this.element = element
    
    // 使用块级编辑器架构
    // 这里可以选择：Slate、ProseMirror、Tiptap等
    // 暂时使用简单的div实现，后续可以替换为更强大的引擎
    
    this.editor = document.createElement('div')
    this.editor.className = 'rich-text-editor'
    this.editor.contentEditable = 'true'
    this.editor.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
      padding: 16px;
      background: transparent;
      color: inherit;
      overflow-y: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 16px;
      line-height: 1.6;
    `
    
    // 初始化内容
    this.initializeContent(options.value || '')
    
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
    return this.editor?.innerHTML || ''
  }

  setValue(value: string): void {
    if (this.editor) {
      this.initializeContent(value)
    }
  }

  insertText(text: string, position?: PositionSection): void {
    if (!this.editor) return
    
    // 在富文本编辑器中，插入文本需要考虑块级结构
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      range.insertNode(document.createTextNode(text))
      this.emit('change', this.editor.innerHTML)
    }
  }

  replaceSelection(text: string): void {
    if (!this.editor) return
    
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      range.insertNode(document.createTextNode(text))
      this.emit('change', this.editor.innerHTML)
    }
  }

  getSelection(): string {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      return range.toString()
    }
    return ''
  }

  setSelection(start: PositionSection, end: PositionSection): void {
    // 在富文本编辑器中，位置计算更复杂
    // 这里需要根据块级结构来计算位置
    console.log('setSelection not implemented for rich text editor')
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

  // 富文本编辑器特有方法
  insertBlock(blockType: string, content?: string): void {
    if (!this.editor) return
    
    const block = this.createBlock(blockType, content)
    this.editor.appendChild(block)
    this.emit('change', this.editor.innerHTML)
  }

  deleteBlock(blockElement: HTMLElement): void {
    if (!this.editor) return
    
    if (this.editor.contains(blockElement)) {
      this.editor.removeChild(blockElement)
      this.emit('change', this.editor.innerHTML)
    }
  }

  private createBlock(blockType: string, content?: string): HTMLElement {
    const block = document.createElement('div')
    block.className = `block block-${blockType}`
    block.contentEditable = 'true'
    
    switch (blockType) {
      case 'paragraph':
        block.innerHTML = content || '<br>'
        break
      case 'heading':
        const heading = document.createElement('h1')
        heading.textContent = content || ''
        block.appendChild(heading)
        break
      case 'list':
        const list = document.createElement('ul')
        const item = document.createElement('li')
        item.textContent = content || ''
        list.appendChild(item)
        block.appendChild(list)
        break
      case 'code':
        const code = document.createElement('pre')
        code.innerHTML = `<code>${content || ''}</code>`
        block.appendChild(code)
        break
      default:
        block.innerHTML = content || '<br>'
    }
    
    return block
  }

  private initializeContent(content: string): void {
    if (!this.editor) return
    
    if (content.trim()) {
      // 如果有内容，尝试解析为HTML
      this.editor.innerHTML = content
    } else {
      // 创建默认的段落块
      const defaultBlock = this.createBlock('paragraph')
      this.editor.appendChild(defaultBlock)
    }
  }

  private bindEvents(): void {
    if (!this.editor) return
    
    this.editor.addEventListener('input', () => {
      this.emit('change', this.editor.innerHTML)
    })
    
    this.editor.addEventListener('keydown', (e: KeyboardEvent) => {
      this.handleKeyDown(e)
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

  private handleKeyDown(e: KeyboardEvent): void {
    // 处理富文本编辑器的快捷键
    switch (e.key) {
      case 'Enter':
        if (e.shiftKey) {
          // Shift+Enter: 在块内换行
          return
        } else {
          // Enter: 创建新块
          e.preventDefault()
          this.insertBlock('paragraph')
        }
        break
      case 'Backspace':
        // 处理空块的删除
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          const block = this.getBlockElement(range.startContainer)
          if (block && this.isBlockEmpty(block)) {
            e.preventDefault()
            this.deleteBlock(block)
          }
        }
        break
      case '/':
        // 触发块类型选择器
        this.emit('showBlockMenu')
        break
    }
  }

  private getBlockElement(node: Node): HTMLElement | null {
    let current = node
    while (current && current !== this.editor) {
      if (current.nodeType === Node.ELEMENT_NODE && 
          (current as HTMLElement).classList.contains('block')) {
        return current as HTMLElement
      }
      current = current.parentNode!
    }
    return null
  }

  private isBlockEmpty(block: HTMLElement): boolean {
    return block.textContent?.trim() === '' || block.innerHTML === '<br>'
  }

  private applyOptions(options: EditorOptions): void {
    if (!this.editor) return
    
    // 应用富文本特定配置
    if (options.richTextOptions) {
      const rtOptions = options.richTextOptions
      
      if (rtOptions.showToolbar !== undefined) {
        // 这里可以实现工具栏显示逻辑
      }
      
      if (rtOptions.blockTypes) {
        // 这里可以配置支持的块类型
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
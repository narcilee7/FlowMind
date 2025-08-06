import { EditorPlugin, EditorContextValue } from '../core/EditorProvider'

// Markdown插件
export class MarkdownPlugin implements EditorPlugin {
  id = 'markdown'
  name = 'Markdown Support'
  version = '1.0.0'
  
  private context: EditorContextValue | null = null
  private unsubscribe: (() => void)[] = []

  activate(context: EditorContextValue): void {
    this.context = context
    
    // 注册命令
    this.registerCommands()
    
    // 注册事件监听
    this.registerEventListeners()
    
    // 注册快捷键
    this.registerKeybindings()
  }

  deactivate(): void {
    // 清理事件监听
    this.unsubscribe.forEach(unsub => unsub())
    this.unsubscribe = []
    
    this.context = null
  }

  commands = {
    'markdown.bold': () => this.wrapSelection('**', '**'),
    'markdown.italic': () => this.wrapSelection('*', '*'),
    'markdown.code': () => this.wrapSelection('`', '`'),
    'markdown.codeBlock': () => this.wrapSelection('```\n', '\n```'),
    'markdown.link': () => this.insertLink(),
    'markdown.image': () => this.insertImage(),
    'markdown.heading': (level: number = 1) => this.insertHeading(level),
    'markdown.list': (ordered: boolean = false) => this.insertList(ordered),
    'markdown.quote': () => this.insertQuote(),
    'markdown.hr': () => this.insertHorizontalRule(),
    'markdown.table': () => this.insertTable(),
  }

  keybindings = [
    { key: 'ctrl+b', command: 'markdown.bold' },
    { key: 'ctrl+i', command: 'markdown.italic' },
    { key: 'ctrl+k', command: 'markdown.code' },
    { key: 'ctrl+shift+k', command: 'markdown.codeBlock' },
    { key: 'ctrl+l', command: 'markdown.link' },
    { key: 'ctrl+shift+i', command: 'markdown.image' },
    { key: 'ctrl+1', command: 'markdown.heading', when: '1' },
    { key: 'ctrl+2', command: 'markdown.heading', when: '2' },
    { key: 'ctrl+3', command: 'markdown.heading', when: '3' },
    { key: 'ctrl+shift+l', command: 'markdown.list', when: 'false' },
    { key: 'ctrl+shift+o', command: 'markdown.list', when: 'true' },
    { key: 'ctrl+shift+q', command: 'markdown.quote' },
    { key: 'ctrl+shift+h', command: 'markdown.hr' },
    { key: 'ctrl+shift+t', command: 'markdown.table' },
  ]

  private registerCommands(): void {
    if (!this.context) return

    Object.entries(this.commands).forEach(([id, handler]) => {
      this.context!.emit('registerCommand', { id, handler })
    })
  }

  private registerEventListeners(): void {
    if (!this.context) return

    // 监听内容变化，提供实时预览
    const unsub1 = this.context.subscribe('contentChanged', (content: string) => {
      this.processContent(content)
    })

    // 监听光标位置变化，提供上下文提示
    const unsub2 = this.context.subscribe('cursorPositionChanged', (position: any) => {
      this.provideContextHints(position)
    })

    this.unsubscribe.push(unsub1, unsub2)
  }

  private registerKeybindings(): void {
    if (!this.context) return

    this.keybindings.forEach(binding => {
      this.context!.emit('registerKeybinding', binding)
    })
  }

  // 包装选中文本
  private wrapSelection(prefix: string, suffix: string): void {
    if (!this.context) return

    const selection = this.context.getSelection()
    if (selection) {
      const newText = `${prefix}${selection}${suffix}`
      this.context.replaceSelection(newText)
    } else {
      // 如果没有选中文本，插入占位符
      const placeholder = 'text'
      const newText = `${prefix}${placeholder}${suffix}`
      this.context.insertText(newText)
      
      // 选中占位符文本
      // 这里需要与编辑器实例交互来选择文本
      this.context.emit('selectText', { start: 0, end: placeholder.length })
    }
  }

  // 插入链接
  private insertLink(): void {
    if (!this.context) return

    const selection = this.context.getSelection()
    const linkText = selection || '链接文本'
    const linkUrl = 'https://example.com'
    
    const newText = `[${linkText}](${linkUrl})`
    this.context.replaceSelection(newText)
  }

  // 插入图片
  private insertImage(): void {
    if (!this.context) return

    const selection = this.context.getSelection()
    const altText = selection || '图片描述'
    const imageUrl = 'https://example.com/image.jpg'
    
    const newText = `![${altText}](${imageUrl})`
    this.context.replaceSelection(newText)
  }

  // 插入标题
  private insertHeading(level: number): void {
    if (!this.context) return

    const selection = this.context.getSelection()
    const headingText = selection || '标题'
    const prefix = '#'.repeat(level)
    
    const newText = `${prefix} ${headingText}`
    this.context.replaceSelection(newText)
  }

  // 插入列表
  private insertList(ordered: boolean): void {
    if (!this.context) return

    const selection = this.context.getSelection()
    const listText = selection || '列表项'
    const prefix = ordered ? '1. ' : '- '
    
    const newText = `${prefix}${listText}`
    this.context.replaceSelection(newText)
  }

  // 插入引用
  private insertQuote(): void {
    if (!this.context) return

    const selection = this.context.getSelection()
    const quoteText = selection || '引用文本'
    
    const newText = `> ${quoteText}`
    this.context.replaceSelection(newText)
  }

  // 插入分割线
  private insertHorizontalRule(): void {
    if (!this.context) return

    const newText = '\n---\n'
    this.context.insertText(newText)
  }

  // 插入表格
  private insertTable(): void {
    if (!this.context) return

    const tableText = `| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 内容1 | 内容2 | 内容3 |
| 内容4 | 内容5 | 内容6 |`
    
    this.context.insertText(tableText)
  }

  // 处理内容变化
  private processContent(content: string): void {
    // 这里可以添加内容处理逻辑
    // 比如自动格式化、语法检查等
    console.log('Processing markdown content:', content.length, 'characters')
  }

  // 提供上下文提示
  private provideContextHints(position: any): void {
    // 这里可以添加智能提示逻辑
    // 比如根据光标位置提供相应的Markdown语法建议
    console.log('Providing context hints at position:', position)
  }
} 
import { EditorAdapter, EditorOptions, EditorType, PositionSection, ScrollPosition, SelectionRange } from '../types'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import CodeBlock from '@tiptap/extension-code-block'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Typography from '@tiptap/extension-typography'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import BubbleMenu from '@tiptap/extension-bubble-menu'
import FloatingMenu from '@tiptap/extension-floating-menu'
import History from '@tiptap/extension-history'

export class TipTapAdapter implements EditorAdapter {
  // 编辑器类型
  type = EditorType.RICH_TEXT
  // 元素
  private element: HTMLElement | null = null
  // 事件监听器
  private eventListeners: Map<string, Function[]> = new Map()
  // 编辑器实例
  private editor: any = null
  // 是否已销毁
  private isDestroyed = false

  async create(element: HTMLElement, options: EditorOptions): Promise<void> {
    this.element = element
    this.isDestroyed = false

    // 创建TipTap编辑器实例
    this.editor = useEditor({
      extensions: [
        // StarterKit.configure({
        //   history: false, // 我们使用独立的History扩展
        // }),
        StarterKit,
        Placeholder.configure({
          placeholder: options.placeholder || '开始编写...',
        }),
        Highlight,
        CodeBlock.configure({
          HTMLAttributes: {
            class: 'bg-gray-100 dark:bg-gray-800 rounded p-2 font-mono text-sm',
          },
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-blue-600 hover:text-blue-800 underline',
          },
        }),
        Image.configure({
          HTMLAttributes: {
            class: 'max-w-full h-auto rounded',
          },
        }),
        Table.configure({
          resizable: true,
          HTMLAttributes: {
            class: 'border-collapse border border-gray-300 dark:border-gray-600',
          },
        }),
        TableRow,
        TableCell.configure({
          HTMLAttributes: {
            class: 'border border-gray-300 dark:border-gray-600 px-3 py-2',
          },
        }),
        TableHeader.configure({
          HTMLAttributes: {
            class: 'border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-100 dark:bg-gray-700 font-bold',
          },
        }),
        TaskList,
        TaskItem.configure({
          nested: true,
          HTMLAttributes: {
            class: 'flex items-start gap-2',
          },
        }),
        Typography,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Underline,
        Strike,
        Superscript,
        Subscript,
        Color,
        TextStyle,
        BubbleMenu.configure({
          element: null, // 将在React组件中设置
        }),
        FloatingMenu.configure({
          element: null, // 将在React组件中设置
        }),
        History,
      ],
      content: options.value || '',
      editorProps: {
        attributes: {
          class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
        },
      },
      onUpdate: ({ editor }) => {
        if (!this.isDestroyed) {
          this.emit('change', editor.getHTML())
        }
      },
      onSelectionUpdate: ({ editor }) => {
        if (!this.isDestroyed) {
          this.emit('selectionChange', {
            text: editor.state.doc.textBetween(
              editor.state.selection.from,
              editor.state.selection.to
            ),
            from: editor.state.selection.from,
            to: editor.state.selection.to,
          })
        }
      },
      onFocus: () => {
        if (!this.isDestroyed) {
          this.emit('focus')
        }
      },
      onBlur: () => {
        if (!this.isDestroyed) {
          this.emit('blur')
        }
      },
    })

    // 创建React组件容器
    const React = await import('react')
    const { createRoot } = await import('react-dom/client')
    
    const TipTapComponent = () => {
      return React.createElement(EditorContent, {
        editor: this.editor,
        className: 'w-full h-full overflow-y-auto p-4',
      })
    }

    const container = document.createElement('div')
    container.className = 'w-full h-full'
    element.appendChild(container)

    const root = createRoot(container)
    root.render(React.createElement(TipTapComponent))

    // 应用配置
    this.applyOptions(options)
  }

  destroy(): void {
    this.isDestroyed = true
    if (this.editor) {
      this.editor.destroy()
      this.editor = null
    }
    if (this.element) {
      this.element.innerHTML = ''
      this.element = null
    }
    this.eventListeners.clear()
  }

  getValue(): string {
    return this.editor?.getHTML() || ''
  }

  setValue(value: string): void {
    if (this.editor) {
      this.editor.commands.setContent(value)
    }
  }

  insertText(text: string, position?: PositionSection): void {
    if (!this.editor) return

    if (position) {
      // 在指定位置插入文本
      this.editor.commands.insertContentAt(position.line, text)
    } else {
      // 在当前光标位置插入文本
      this.editor.commands.insertContent(text)
    }
  }

  replaceSelection(text: string): void {
    if (!this.editor) return
    this.editor.commands.insertContent(text)
  }

  getSelection(): string {
    if (!this.editor) return ''
    return this.editor.state.doc.textBetween(
      this.editor.state.selection.from,
      this.editor.state.selection.to
    )
  }

  setSelection(start: PositionSection, end: PositionSection): void {
    if (!this.editor) return
    this.editor.commands.setTextSelection({
      from: start.column,
      to: end.column
    })
  }

  getCursorPosition(): PositionSection {
    if (!this.editor) {
      return {
        line: 0,
        column: 0
      }
    }
    const { from, to } = this.editor.state.selection
    return {
      line: from as number,
      column: to as number,
    }
  }

  setCursorPosition(position: PositionSection): void {
    if (!this.editor) return
    this.editor.commands.setTextSelection({
      from: position.line,
      to: position.column
    })
  }

  getSelectionRange(): SelectionRange | null {
    if (!this.editor) return null
    const { from, to } = this.editor.state.selection
    return {
      from: from as number,
      to: to as number,
      line: from as number,
      column: to as number
    } 
  }

  setSelectionRange(range: SelectionRange): void {
    if (!this.editor) return
    this.editor.commands.setTextSelection({
      from: range.from,
      to: range.to,
      line: range.line,
      column: range.column
    })
  }

  getScrollPosition(): ScrollPosition {
    if (!this.editor) return { scrollTop: 0, scrollLeft: 0 }
    const { scrollTop, scrollLeft } = this.editor.view.dom
    return {
      scrollTop: scrollTop as number,
      scrollLeft: scrollLeft as number
    }
  }

  setScrollPosition(position: ScrollPosition): void {
    if (!this.editor) return
    this.editor.view.dom.scrollTop = position.scrollTop
    this.editor.view.dom.scrollLeft = position.scrollLeft
  }

  scrollToLine(line: number): void {
    if (!this.editor) return
    this.editor.commands.scrollTo({
      line,
      column: 0,
      behavior: 'smooth'
    })
  }

  updateOptions(options: Partial<EditorOptions>): void {
    if (!this.editor) return
    this.editor.options.extensions = options.extensions
  }

  getOption<K extends keyof EditorOptions>(key: K): EditorOptions[K] {
    if (!this.editor) return null
    return this.editor.options[key]
  }

  focus(): void {
    this.editor?.commands.focus()
  }

  blur(): void {
    this.editor?.commands.blur()
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

  addCommand(id: string, handler: Function): void {
    if (!this.editor) return
    this.editor.commands.register(id, handler)
  }

  isFocused(): boolean {
    return this.editor?.isFocused || false
  }

  // TipTap特有的AI功能方法
  async insertAICompletion(text: string): Promise<void> {
    if (!this.editor) return
    
    // 插入AI生成的文本，带有特殊标记
    const aiNode = this.editor.schema.nodes.paragraph.create(
      null,
      [
        this.editor.schema.text(text, [
          this.editor.schema.marks.textStyle.create({ color: '#10b981' }),
        ]),
      ]
    )
    
    this.editor.commands.insertContent(aiNode)
  }

  async insertAISuggestion(suggestions: string[]): Promise<void> {
    if (!this.editor) return
    
    // 插入AI建议列表
    const suggestionNodes = suggestions.map(suggestion => 
      this.editor.schema.nodes.taskItem.create(
        { checked: false },
        [this.editor.schema.text(suggestion)]
      )
    )
    
    const taskList = this.editor.schema.nodes.taskList.create(
      null,
      suggestionNodes
    )
    
    this.editor.commands.insertContent(taskList)
  }

  async highlightAIText(from: number, to: number): Promise<void> {
    if (!this.editor) return
    
    this.editor.commands.setTextSelection({ from, to })
    this.editor.commands.toggleHighlight({ color: '#fbbf24' })
  }

  async insertAICodeBlock(code: string, language: string = 'javascript'): Promise<void> {
    if (!this.editor) return
    
    this.editor.commands.insertContent({
      type: 'codeBlock',
      attrs: { language },
      content: [{ type: 'text', text: code }],
    })
  }

  async insertAITable(headers: string[], rows: string[][]): Promise<void> {
    if (!this.editor) return
    
    const tableRows = [
      // 表头行
      this.editor.schema.nodes.tableRow.create(
        null,
        headers.map(header =>
          this.editor.schema.nodes.tableHeader.create(
            null,
            [this.editor.schema.text(header)]
          )
        )
      ),
      // 数据行
      ...rows.map(row =>
        this.editor.schema.nodes.tableRow.create(
          null,
          row.map(cell =>
            this.editor.schema.nodes.tableCell.create(
              null,
              [this.editor.schema.text(cell)]
            )
          )
        )
      ),
    ]
    
    const table = this.editor.schema.nodes.table.create(null, tableRows)
    this.editor.commands.insertContent(table)
  }

  // 获取编辑器状态信息
  getEditorState(): any {
    if (!this.editor) return null
    
    return {
      content: this.editor.getHTML(),
      selection: {
        from: this.editor.state.selection.from,
        to: this.editor.state.selection.to,
        text: this.getSelection(),
      },
      isFocused: this.editor.isFocused,
      isEmpty: this.editor.isEmpty,
      canUndo: this.editor.can().undo(),
      canRedo: this.editor.can().redo(),
    }
  }

  // 执行编辑器命令
  executeCommand(command: string, ...args: any[]): boolean {
    if (!this.editor) return false
    
    const commands = this.editor.commands
    if (typeof commands[command] === 'function') {
      return commands[command](...args)
    }
    return false
  }

  // 获取可用命令列表
  getAvailableCommands(): string[] {
    if (!this.editor) return []
    
    return Object.keys(this.editor.commands).filter(
      key => typeof this.editor.commands[key] === 'function'
    )
  }

  private applyOptions(options: EditorOptions): void {
    if (!this.editor) return

    // 应用主题配置
    if (options.theme) {
      const element = this.editor.view.dom
      element.className = `${element.className} theme-${options.theme}`
    }

    // 应用只读模式
    if (options.readOnly) {
      this.editor.setEditable(false)
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }
  }
} 
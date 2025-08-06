/**
 * TipTap适配器 - 重构版
 * 基于TipTap的富文本编辑器适配器
 */

import { EditorAdapter, EditorOptions } from '../types/EditorAdapter'
import { EditorType, SceneTemplate } from '../types/EditorType'
import { TOCItem } from '../types/EditorState'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlock from '@tiptap/extension-code-block'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import History from '@tiptap/extension-history'

/**
 * TipTap适配器
 */
export class TipTapAdapter implements EditorAdapter {
    public type: EditorType = EditorType.RICH_TEXT
    public sceneTemplate: SceneTemplate
    
    private element: HTMLElement | null = null
    private options: EditorOptions | null = null
    private editor: any = null
    private contentCallbacks: ((content: string) => void)[] = []
    private selectionCallbacks: ((selection: string) => void)[] = []
    private tocCallbacks: ((toc: TOCItem[]) => void)[] = []
    private focusCallbacks: (() => void)[] = []
    private blurCallbacks: (() => void)[] = []
    private keyDownCallbacks: ((event: KeyboardEvent) => void)[] = []
    private isInitialized = false

    constructor(sceneTemplate: SceneTemplate) {
        this.sceneTemplate = sceneTemplate
    }

    /**
     * 创建编辑器
     */
    async create(element: HTMLElement, options: EditorOptions): Promise<void> {
        this.element = element
        this.options = options
        
        // 创建TipTap编辑器
        this.editor = useEditor({
            extensions: [
                StarterKit,
                Placeholder.configure({
                    placeholder: options.placeholder || '开始编写...',
                }),
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
                TextAlign.configure({
                    types: ['heading', 'paragraph'],
                }),
                Underline,
                Strike,
                History,
            ],
            content: options.content || '',
            onUpdate: ({ editor }) => {
                const content = editor.getHTML()
                this.triggerContentChange(content)
            },
            onSelectionUpdate: ({ editor }) => {
                const selection = editor.state.doc.textBetween(
                    editor.state.selection.from,
                    editor.state.selection.to
                )
                this.triggerSelectionChange(selection)
            },
            onFocus: () => {
                this.triggerFocus()
            },
            onBlur: () => {
                this.triggerBlur()
            },
        })

        // 渲染编辑器
        this.renderEditor()
        
        this.isInitialized = true
    }

    /**
     * 销毁编辑器
     */
    destroy(): void {
        if (this.editor) {
            this.editor.destroy()
            this.editor = null
        }
        
        if (this.element) {
            this.element.innerHTML = ''
        }
        
        this.element = null
        this.options = null
        this.isInitialized = false
    }

    /**
     * 获取编辑器值
     */
    getValue(): string {
        return this.editor?.getHTML() || ''
    }

    /**
     * 设置编辑器值
     */
    setValue(value: string): void {
        if (this.editor) {
            this.editor.commands.setContent(value)
        }
    }

    /**
     * 获取选择内容
     */
    getSelection(): string {
        if (!this.editor) return ''
        
        return this.editor.state.doc.textBetween(
            this.editor.state.selection.from,
            this.editor.state.selection.to
        )
    }

    /**
     * 设置选择范围
     */
    setSelection(start: number, end: number): void {
        if (this.editor) {
            this.editor.commands.setTextSelection({ from: start, to: end })
        }
    }

    // 富文本格式化操作
    formatBold(): void {
        this.editor?.chain().focus().toggleBold().run()
    }

    formatItalic(): void {
        this.editor?.chain().focus().toggleItalic().run()
    }

    formatUnderline(): void {
        this.editor?.chain().focus().toggleUnderline().run()
    }

    formatStrikethrough(): void {
        this.editor?.chain().focus().toggleStrike().run()
    }

    formatCode(): void {
        this.editor?.chain().focus().toggleCode().run()
    }

    formatLink(url: string): void {
        this.editor?.chain().focus().setLink({ href: url }).run()
    }

    insertImage(url: string, alt?: string): void {
        this.editor?.chain().focus().setImage({ src: url, alt: alt || '' }).run()
    }

    // 块级操作
    insertHeading(level: 1 | 2 | 3 | 4 | 5 | 6): void {
        this.editor?.chain().focus().toggleHeading({ level }).run()
    }

    insertParagraph(): void {
        this.editor?.chain().focus().setParagraph().run()
    }

    insertBulletList(): void {
        this.editor?.chain().focus().toggleBulletList().run()
    }

    insertNumberedList(): void {
        this.editor?.chain().focus().toggleOrderedList().run()
    }

    insertBlockquote(): void {
        this.editor?.chain().focus().toggleBlockquote().run()
    }

    insertCodeBlock(language?: string): void {
        this.editor?.chain().focus().toggleCodeBlock({ language: language || 'javascript' }).run()
    }

    insertTable(rows: number, cols: number): void {
        this.editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
    }

    // 目录操作
    generateTOC(): TOCItem[] {
        if (!this.editor) return []
        
        const toc: TOCItem[] = []
        const doc = this.editor.state.doc
        
        doc.descendants((node: any, pos: number) => {
            if (node.type.name === 'heading') {
                const level = node.attrs.level
                const text = node.textContent
                toc.push({
                    id: `heading-${pos}`,
                    title: text,
                    level,
                    position: pos,
                    children: []
                })
            }
        })
        
        return toc
    }

    navigateToSection(sectionId: string): void {
        // 实现导航到指定章节
        console.log('Navigate to section:', sectionId)
    }

    updateTOC(): void {
        const toc = this.generateTOC()
        this.triggerTOCChange(toc)
    }

    // AI集成
    async processAIInput(input: string): Promise<void> {
        // 实现AI输入处理
        console.log('Process AI input:', input)
    }

    async applyAISuggestion(suggestionId: string): Promise<void> {
        // 实现AI建议应用
        console.log('Apply AI suggestion:', suggestionId)
    }

    // 事件监听
    onContentChange(callback: (content: string) => void): void {
        this.contentCallbacks.push(callback)
    }

    onSelectionChange(callback: (selection: string) => void): void {
        this.selectionCallbacks.push(callback)
    }

    onTOCChange(callback: (toc: TOCItem[]) => void): void {
        this.tocCallbacks.push(callback)
    }

    onFocus(callback: () => void): void {
        this.focusCallbacks.push(callback)
    }

    onBlur(callback: () => void): void {
        this.blurCallbacks.push(callback)
    }

    onKeyDown(callback: (event: KeyboardEvent) => void): void {
        this.keyDownCallbacks.push(callback)
    }

    // 工具方法
    focus(): void {
        this.editor?.chain().focus().run()
    }

    blur(): void {
        this.editor?.chain().blur().run()
    }

    isFocused(): boolean {
        return this.editor?.isFocused() || false
    }

    undo(): void {
        this.editor?.chain().focus().undo().run()
    }

    redo(): void {
        this.editor?.chain().focus().redo().run()
    }

    canUndo(): boolean {
        return this.editor?.can().undo() || false
    }

    canRedo(): boolean {
        return this.editor?.can().redo() || false
    }

    // 私有方法
    private renderEditor(): void {
        if (!this.element || !this.editor) return

        // 创建React组件来渲染编辑器
        const React = require('react')
        const { createRoot } = require('react-dom/client')
        const root = createRoot(this.element)
        
        root.render(
            React.createElement(EditorContent, { editor: this.editor })
        )
    }

    private triggerContentChange(content: string): void {
        this.contentCallbacks.forEach(callback => callback(content))
    }

    private triggerSelectionChange(selection: string): void {
        this.selectionCallbacks.forEach(callback => callback(selection))
    }

    private triggerTOCChange(toc: TOCItem[]): void {
        this.tocCallbacks.forEach(callback => callback(toc))
    }

    private triggerFocus(): void {
        this.focusCallbacks.forEach(callback => callback())
    }

    private triggerBlur(): void {
        this.blurCallbacks.forEach(callback => callback())
    }
} 
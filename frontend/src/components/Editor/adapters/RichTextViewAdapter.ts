/**
 * 富文本视图适配器
 * 基于TipTap/ProseMirror实现，提供完整的富文本编辑功能
 */

import { ViewAdapterOptions, RichTextViewAdapter as IRichTextViewAdapter, TextFormat } from '@/components/Editor/types/ViewAdapter'
import { EditorType } from '@/components/Editor/types/EditorType'
import { DocumentAST, ASTNode, Selection, RichTextNode } from '@/components/Editor/types/EditorAST'
import { BaseViewAdapter, EventCallback } from './BaseViewAdapter'
import { ASTUtils } from '../utils/ASTUtils'

/**
 * TipTap编辑器类型定义
 */
interface TipTapEditor {
    commands: {
        setContent: (content: any, options?: any) => boolean
        focus: () => void
        blur: () => void
        setTextSelection: (position: number | { from: number; to: number }) => void
        insertContent: (content: any) => void
        deleteSelection: () => void
        toggleBold: () => void
        toggleItalic: () => void
        toggleUnderline: () => void
        toggleStrike: () => void
        setColor: (color: string) => void
        setMark: (mark: string, attributes: Record<string, any>) => void
        setTextAlign: (align: 'left' | 'center' | 'right' | 'justify') => void
    }
    state: {
        selection: {
            from: number
            to: number
        }
    }
    isFocused: boolean
    getHTML: () => string
    destroy: () => void
    on: (event: string, callback: Function) => void
}

/**
 * 富文本视图适配器实现
 */
export class RichTextViewAdapter extends BaseViewAdapter implements IRichTextViewAdapter {
    public readonly type: EditorType.RICH_TEXT = EditorType.RICH_TEXT
    
    private editor: TipTapEditor | null = null
    private contentUpdateQueue: (() => void)[] = []
    private isUpdating = false

    /**
     * 创建适配器
     */
    async create(element: HTMLElement, options: ViewAdapterOptions): Promise<void> {
        if (this.isInitialized) {
            this.handleError(new Error('Adapter already initialized'), 'create')
            return
        }

        this.element = element
        this.options = options

        try {
            // 动态导入TipTap相关模块
            const { Editor } = await import('@tiptap/react')
            const { StarterKit } = await import('@tiptap/starter-kit')
            const { Underline } = await import('@tiptap/extension-underline')
            const { TextAlign } = await import('@tiptap/extension-text-align')
            const { Color } = await import('@tiptap/extension-color')
            const { TextStyle } = await import('@tiptap/extension-text-style')
            const { Link } = await import('@tiptap/extension-link')
            const { Image } = await import('@tiptap/extension-image')
            const { Table } = await import('@tiptap/extension-table')
            const { TableRow } = await import('@tiptap/extension-table-row')
            const { TableCell } = await import('@tiptap/extension-table-cell')
            const { TableHeader } = await import('@tiptap/extension-table-header')

            // 创建TipTap编辑器
            this.editor = new Editor({
                element: this.element,
                // 扩展配置
                extensions: [
                    // 基础扩展
                    StarterKit,
                    Underline,
                    TextAlign.configure({
                        types: ['heading', 'paragraph'],
                    }),
                    Color,
                    TextStyle,
                    Link.configure({
                        openOnClick: false,
                    }),
                    // 媒体扩展
                    Image,
                    Table.configure({
                        resizable: true,
                    }),
                    // 表格扩展
                    TableRow,
                    TableCell,
                    TableHeader,
                ],
                // 初始内容
                content: '',
                // 编辑器属性
                editorProps: {
                    attributes: {
                        class: 'rich-text-editor',
                        spellcheck: 'false',
                    },
                },
                // 事件监听
                onUpdate: ({ editor }: any) => {
                    this.handleContentUpdate(editor)
                },
                onSelectionUpdate: ({ editor }: any) => {
                    this.handleSelectionUpdate(editor)
                },
                onFocus: () => {
                    this.triggerEvent('focus')
                },
                onBlur: () => {
                    this.triggerEvent('blur')
                },
            }) as any

            // 设置主题样式
            this.applyTheme(options.theme || 'auto')
            
            this.isInitialized = true
            this.triggerEvent('viewChange', { type: 'initialized' })

        } catch (error) {
            this.handleError(error as Error, 'create')
            throw error
        }
    }

    /**
     * 执行销毁逻辑
     */
    protected performDestroy(): void {
        if (this.editor) {
            this.editor.destroy()
            this.editor = null
        }
    }

    /**
     * 渲染AST
     */
    render(ast: DocumentAST): void {
        if (!this.validateInitialized() || !this.editor) return

        const content = this.safeSync(() => this.astToTipTapContent(ast), 'render')
        if (content) {
            this.editor.commands.setContent(content, false)
        }
    }

    /**
     * 更新节点
     */
    updateNode(nodeId: string, node: ASTNode): void {
        if (!this.validateInitialized() || !this.editor) return

        // 查找节点在文档中的位置
        const nodePath = this.safeSync(() => ASTUtils.getNodePath(this.getCurrentAST(), nodeId), 'updateNode')
        if (!nodePath) {
            this.handleError(new Error(`Node ${nodeId} not found`), 'updateNode')
            return
        }

        // 计算节点在编辑器中的位置
        const position = this.calculateNodePosition(nodePath)
        if (position !== null) {
            // 获取节点内容
            const content = this.safeSync(() => this.nodeToHtml(node), 'updateNode')
            if (content) {
                // 替换节点内容
                this.editor.commands.setTextSelection({ from: position.start, to: position.end })
                this.editor.commands.insertContent(content)
            }
        }
    }

    /**
     * 删除节点
     */
    removeNode(nodeId: string): void {
        if (!this.validateInitialized() || !this.editor) return

        const nodePath = this.safeSync(() => ASTUtils.getNodePath(this.getCurrentAST(), nodeId), 'removeNode')
        if (!nodePath) {
            this.handleError(new Error(`Node ${nodeId} not found`), 'removeNode')
            return
        }

        const position = this.calculateNodePosition(nodePath)
        if (position !== null) {
            this.editor.commands.setTextSelection({ from: position.start, to: position.end })
            this.editor.commands.deleteSelection()
        }
    }

    /**
     * 添加节点
     */
    addNode(node: ASTNode, parentId?: string, index?: number): void {
        if (!this.validateInitialized() || !this.editor) return

        const content = this.safeSync(() => this.nodeToHtml(node), 'addNode')
        if (!content) return

        if (parentId) {
            // 添加到指定父节点
            const parentPath = this.safeSync(() => ASTUtils.getNodePath(this.getCurrentAST(), parentId), 'addNode')
            if (parentPath) {
                const position = this.calculateNodePosition(parentPath)
                if (position !== null) {
                    this.editor.commands.setTextSelection(position.end)
                    this.editor.commands.insertContent(content)
                }
            }
        } else {
            // 添加到文档末尾
            const docLength = this.editor.getHTML().length
            this.editor.commands.setTextSelection(docLength)
            this.editor.commands.insertContent(content)
        }
    }

    /**
     * 设置选择状态
     */
    setSelection(selection: Selection): void {
        if (!this.validateInitialized() || !this.editor) return

        if (selection.type === 'text' && selection.range) {
            const { start, end } = selection.range
            this.editor.commands.setTextSelection({ from: start, to: end })
        } else if (selection.type === 'node' && selection.nodeIds.length > 0) {
            // 对于节点选择，选择第一个节点
            const nodeId = selection.nodeIds[0]
            const nodePath = this.safeSync(() => ASTUtils.getNodePath(this.getCurrentAST(), nodeId), 'setSelection')
            if (nodePath) {
                const position = this.calculateNodePosition(nodePath)
                if (position !== null) {
                    this.editor.commands.setTextSelection({ from: position.start, to: position.end })
                }
            }
        }
    }

    /**
     * 获取选择状态
     */
    getSelection(): Selection {
        if (!this.validateInitialized() || !this.editor) {
            return { nodeIds: [], type: 'node' }
        }

        const { from, to } = this.editor.state.selection
        if (from === to) {
            // 光标位置
            return { nodeIds: [], type: 'node' }
        } else {
            // 文本选择
            const nodeId = this.findNodeIdAtPosition(from)
            return {
                nodeIds: nodeId ? [nodeId] : [],
                type: 'text',
                range: {
                    start: from,
                    end: to,
                    nodeId: nodeId || 'unknown'
                }
            }
        }
    }

    /**
     * 设置焦点
     */
    focus(): void {
        if (this.validateInitialized() && this.editor) {
            this.editor.commands.focus()
        }
    }

    /**
     * 失去焦点
     */
    blur(): void {
        if (this.validateInitialized() && this.editor) {
            this.editor.commands.blur()
        }
    }

    /**
     * 是否获得焦点
     */
    isFocused(): boolean {
        return this.editor ? this.editor.isFocused : false
    }

    /**
     * 滚动到节点
     */
    scrollToNode(nodeId: string): void {
        if (!this.validateInitialized() || !this.element) return

        const nodeElement = this.element.querySelector(`[data-node-id="${nodeId}"]`)
        if (nodeElement) {
            nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }

    /**
     * 放大视图
     */
    zoomIn(): void {
        if (!this.validateInitialized() || !this.element) return

        const currentZoom = parseFloat(this.element.style.zoom || '1')
        this.element.style.zoom = `${Math.min(currentZoom * 1.2, 3)}`
        this.triggerEvent('viewChange', { type: 'zoom', zoom: this.element.style.zoom })
    }

    /**
     * 缩小视图
     */
    zoomOut(): void {
        if (!this.validateInitialized() || !this.element) return

        const currentZoom = parseFloat(this.element.style.zoom || '1')
        this.element.style.zoom = `${Math.max(currentZoom * 0.8, 0.5)}`
        this.triggerEvent('viewChange', { type: 'zoom', zoom: this.element.style.zoom })
    }

    /**
     * 重置缩放
     */
    resetZoom(): void {
        if (!this.validateInitialized() || !this.element) return

        this.element.style.zoom = '1'
        this.triggerEvent('viewChange', { type: 'zoom', zoom: '1' })
    }

    /**
     * 适应视图
     */
    fitToView(): void {
        this.resetZoom()
    }

    /**
     * 获取视口
     */
    getViewport(): any {
        if (!this.validateInitialized() || !this.element) {
            return { x: 0, y: 0, width: 0, height: 0, zoom: 1 }
        }

        return {
            x: 0,
            y: 0,
            width: this.element.clientWidth,
            height: this.element.clientHeight,
            zoom: parseFloat(this.element.style.zoom || '1')
        }
    }

    /**
     * 设置视口
     */
    setViewport(viewport: any): void {
        if (!this.validateInitialized() || !this.element) return

        if (viewport.zoom) {
            this.element.style.zoom = `${viewport.zoom}`
        }
        this.triggerEvent('viewChange', { type: 'viewport', viewport })
    }

    // 富文本特有方法
    /**
     * 插入文本
     */
    insertText(text: string, position?: number): void {
        if (!this.validateInitialized() || !this.editor) return

        if (position !== undefined) {
            this.editor.commands.setTextSelection(position)
        }
        this.editor.commands.insertContent(text)
    }

    /**
     * 删除文本
     */
    deleteText(start: number, end: number): void {
        if (!this.validateInitialized() || !this.editor) return

        this.editor.commands.setTextSelection({ from: start, to: end })
        this.editor.commands.deleteSelection()
    }

    /**
     * 格式化文本
     */
    formatText(start: number, end: number, format: TextFormat): void {
        if (!this.validateInitialized() || !this.editor) return

        this.editor.commands.setTextSelection({ from: start, to: end })

        if (format.bold) this.editor.commands.toggleBold()
        if (format.italic) this.editor.commands.toggleItalic()
        if (format.underline) this.editor.commands.toggleUnderline()
        if (format.strikethrough) this.editor.commands.toggleStrike()
        if (format.color) this.editor.commands.setColor(format.color)
        if (format.backgroundColor) this.editor.commands.setMark('textStyle', { backgroundColor: format.backgroundColor })
        if (format.fontSize) this.editor.commands.setMark('textStyle', { fontSize: format.fontSize })
        if (format.fontFamily) this.editor.commands.setMark('textStyle', { fontFamily: format.fontFamily })
        if (format.alignment) {
            switch (format.alignment) {
                case 'left': this.editor.commands.setTextAlign('left'); break
                case 'center': this.editor.commands.setTextAlign('center'); break
                case 'right': this.editor.commands.setTextAlign('right'); break
                case 'justify': this.editor.commands.setTextAlign('justify'); break
            }
        }
    }

    /**
     * 插入节点
     */
    insertNode(node: ASTNode, position?: number): void {
        if (!this.validateInitialized() || !this.editor) return

        const content = this.safeSync(() => this.nodeToHtml(node), 'insertNode')
        if (!content) return

        if (position !== undefined) {
            this.editor.commands.setTextSelection(position)
        }
        this.editor.commands.insertContent(content)
    }

    /**
     * 文本变化事件
     */
    onTextChange(callback: EventCallback<string>): void {
        this.addEventListener('textChange', callback)
    }

    /**
     * 格式变化事件
     */
    onFormatChange(callback: EventCallback<TextFormat>): void {
        this.addEventListener('formatChange', callback)
    }

    // 私有方法
    /**
     * 处理内容更新
     */
    private handleContentUpdate = this.debounce((editor: TipTapEditor): void => {
        const content = editor.getHTML()
        this.triggerEvent('textChange', content)
        this.triggerEvent('viewChange', { type: 'contentUpdate', content })
    }, 100)

    /**
     * 处理选择更新
     */
    private handleSelectionUpdate = this.throttle((editor: TipTapEditor): void => {
        const selection = this.getSelection()
        this.triggerEvent('selectionChange', selection)
    }, 50)

    /**
     * 将AST转换为TipTap可识别的HTML内容
     */
    private astToTipTapContent(ast: DocumentAST): string {
        return this.nodeToHtml(ast.root)
    }

    /**
     * 将节点转换为HTML内容
     */
    private nodeToHtml(node: ASTNode): string {
        if (!node) return ''

        switch (node.type) {
            // 段落
            case 'paragraph':
                return `<p data-node-id="${node.id}">${this.getNodeContent(node)}</p>`
            // 标题
            case 'heading':
                const level = (node as RichTextNode).attributes?.level || 1
                return `<h${level} data-node-id="${node.id}">${this.getNodeContent(node)}</h${level}>`
            // 文本
            case 'text':
                return this.getNodeContent(node)
            // 粗体
            case 'bold':
                return `<strong>${this.getNodeContent(node)}</strong>`
            // 斜体
            case 'italic':
                return `<em>${this.getNodeContent(node)}</em>`
            // 下划线
            case 'underline':
                return `<u>${this.getNodeContent(node)}</u>`
            // 删除线
            case 'strikethrough':
                return `<s>${this.getNodeContent(node)}</s>`
            // 行内代码
            case 'code':
                return `<code>${this.getNodeContent(node)}</code>`
            // 代码块
            case 'codeBlock':
                const language = (node as RichTextNode).attributes?.language || ''
                return `<pre data-node-id="${node.id}"><code class="language-${language}">${this.getNodeContent(node)}</code></pre>`
            // 链接
            case 'link':
                const href = (node as RichTextNode).attributes?.href || '#'
                return `<a href="${href}" data-node-id="${node.id}">${this.getNodeContent(node)}</a>`
            // 图片
            case 'image':
                const src = (node as RichTextNode).attributes?.src || ''
                const alt = (node as RichTextNode).attributes?.alt || ''
                return `<img src="${src}" alt="${alt}" data-node-id="${node.id}" />`
            // 列表
            case 'list':
                const ordered = (node as RichTextNode).attributes?.ordered || false
                const tag = ordered ? 'ol' : 'ul'
                return `<${tag} data-node-id="${node.id}">${this.getChildrenHtml(node)}</${tag}>`
            // 列表项
            case 'listItem':
                return `<li data-node-id="${node.id}">${this.getNodeContent(node)}</li>`
            // 引用
            case 'blockquote':
                return `<blockquote data-node-id="${node.id}">${this.getNodeContent(node)}</blockquote>`
            // 表格
            case 'table':
                return `<table data-node-id="${node.id}">${this.getChildrenHtml(node)}</table>`
            // 表格行
            case 'tableRow':
                return `<tr data-node-id="${node.id}">${this.getChildrenHtml(node)}</tr>`
            // 表格单元格
            case 'tableCell':
                return `<td data-node-id="${node.id}">${this.getNodeContent(node)}</td>`
            // 表格头部
            case 'tableHeader':
                return `<th data-node-id="${node.id}">${this.getNodeContent(node)}</th>`
            // 分割线
            case 'horizontalRule':
                return `<hr data-node-id="${node.id}" />`
            // 其他节点类型
            default:
                return `<div data-node-id="${node.id}">${this.getNodeContent(node)}</div>`
        }
    }

    /**
     * 获取节点内容
     */
    private getNodeContent(node: ASTNode): string {
        if ((node as RichTextNode).content) {
            return (node as RichTextNode).content || ''
        }
        
        if (node.children && node.children.length > 0) {
            return this.getChildrenHtml(node)
        }
        
        return ''
    }

    /**
     * 获取子节点HTML
     */
    private getChildrenHtml(node: ASTNode): string {
        if (!node.children) return ''
        return node.children.map(child => this.nodeToHtml(child)).join('')
    }

    /**
     * 计算节点位置
     * TODO: 需要根据节点路径计算在编辑器中的位置
     */
    private calculateNodePosition(nodePath: number[]): { start: number; end: number } | null {
        // 这里需要根据节点路径计算在编辑器中的位置
        // 这是一个简化的实现，实际应该遍历DOM树来计算
        return { start: 0, end: 0 }
    }

    /**
     * 根据位置查找节点ID
     * TODO: 需要根据位置查找对应的节点ID
     */
    private findNodeIdAtPosition(position: number): string | null {
        // 这里需要根据位置查找对应的节点ID
        // 这是一个简化的实现，实际应该遍历DOM树来查找
        return null
    }

    /**
     * 获取当前AST
     * TODO: 需要从编辑器内容重建AST
     */
    private getCurrentAST(): DocumentAST {
        // 这里应该从当前编辑器内容重建AST
        // 这是一个简化的实现
        return ASTUtils.createDocument('当前文档')
    }
}

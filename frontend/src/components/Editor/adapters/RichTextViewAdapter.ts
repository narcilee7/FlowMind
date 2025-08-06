/**
 * 富文本视图适配器
 * 基于TipTap/ProseMirror实现，提供完整的富文本编辑功能
 */

import { ViewAdapterOptions, RichTextViewAdapter as IRichTextViewAdapter, TextFormat } from '@/components/Editor/types/ViewAdapter'
import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'
import { DocumentAST, ASTNode, Selection, RichTextNode } from '@/components/Editor/types/EditorAST'
import { EditorTheme } from '@/components/Editor/types/EditorTheme'

/**
 * 富文本视图适配器实现
 */
export class RichTextViewAdapter implements IRichTextViewAdapter {
    public type: EditorType.RICH_TEXT = EditorType.RICH_TEXT
    public sceneTemplate: SceneTemplate
    
    private element: HTMLElement | null = null
    private options: ViewAdapterOptions | null = null
    private editor: any = null // TipTap编辑器实例
    // 事件回调表
    private eventCallbacks: Map<string, Function[]> = new Map()
    // 是否已销毁
    private isDestroyed = false

    /**
     * 构造函数
     */
    constructor(sceneTemplate: SceneTemplate) {
        this.sceneTemplate = sceneTemplate
    }

    /**
     * 创建适配器
     */
    async create(element: HTMLElement, options: ViewAdapterOptions): Promise<void> {
        this.element = element
        this.options = options

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
            onUpdate: ({ editor }: { editor: any }) => {
                this.handleContentUpdate(editor)
            },
            onSelectionUpdate: ({ editor }: { editor: any }) => {
                this.handleSelectionUpdate(editor)
            },
            onFocus: () => {
                this.triggerEvent('focus')
            },
            onBlur: () => {
                this.triggerEvent('blur')
            },
        })

        // 设置主题样式
        this.applyTheme(options.theme || 'auto')
    }

    /**
     * 销毁适配器
     */
    destroy(): void {
        if (this.isDestroyed) return

        if (this.editor) {
            this.editor.destroy()
            this.editor = null
        }

        this.element = null
        this.options = null
        this.eventCallbacks.clear()
        this.isDestroyed = true
    }

    /**
     * 渲染AST
     */
    render(ast: DocumentAST): void {
        if (!this.editor || this.isDestroyed) return

        const content = this.astToTipTapContent(ast)
        this.editor.commands.setContent(content, false)
    }

    /**
     * 更新AST
     */
    update(ast: DocumentAST): void {
        this.render(ast)
    }

    /**
     * 更新节点
     */
    updateNode(nodeId: string, node: ASTNode): void {
        if (!this.editor || this.isDestroyed) return

        // 查找并更新特定节点
        const content = this.astToTipTapContent({ root: node } as DocumentAST)
        // TODO: 实现精确的节点更新逻辑
        this.editor.commands.setContent(content, false)
    }

    /**
     * 删除节点
     */
    removeNode(nodeId: string): void {
        if (!this.editor || this.isDestroyed) return

        // TODO: 实现节点删除逻辑
        console.log('Remove node:', nodeId)
    }

    /**
     * 添加节点
     */
    addNode(node: ASTNode, parentId?: string, index?: number): void {
        if (!this.editor || this.isDestroyed) return

        // TODO: 实现节点添加逻辑
        console.log('Add node:', node, 'parent:', parentId, 'index:', index)
    }

    /**
     * 设置选择状态
     */
    setSelection(selection: Selection): void {
        if (!this.editor || this.isDestroyed) return

        if (selection.type === 'text' && selection.range) {
            const { start, end, nodeId } = selection.range
            // TODO: 实现文本选择设置
            console.log('Set text selection:', { start, end, nodeId })
        } else if (selection.type === 'node') {
            // TODO: 实现节点选择设置
            console.log('Set node selection:', selection.nodeIds)
        }
    }

    /**
     * 获取选择状态
     */
    getSelection(): Selection {
        if (!this.editor || this.isDestroyed) {
            return { nodeIds: [], type: 'node' }
        }

        const { from, to } = this.editor.state.selection
        if (from === to) {
            // 光标位置
            return { nodeIds: [], type: 'node' }
        } else {
            // 文本选择
            return {
                nodeIds: [],
                type: 'text',
                range: {
                    start: from,
                    end: to,
                    nodeId: 'current' // TODO: 获取实际的节点ID
                }
            }
        }
    }

    /**
     * 设置焦点
     */
    focus(): void {
        if (this.editor && !this.isDestroyed) {
            this.editor.commands.focus()
        }
    }

    /**
     * 失去焦点
     */
    blur(): void {
        if (this.editor && !this.isDestroyed) {
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
     * 富文本特有方法：插入文本
     */
    insertText(text: string, position?: number): void {
        if (!this.editor || this.isDestroyed) return

        if (position !== undefined) {
            this.editor.commands.setTextSelection(position)
        }
        this.editor.commands.insertContent(text)
    }

    /**
     * 富文本特有方法：删除文本
     */
    deleteText(start: number, end: number): void {
        if (!this.editor || this.isDestroyed) return

        this.editor.commands.setTextSelection({ from: start, to: end })
        this.editor.commands.deleteSelection()
    }

    /**
     * 富文本特有方法：格式化文本
     */
    formatText(start: number, end: number, format: TextFormat): void {
        if (!this.editor || this.isDestroyed) return

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
     * 富文本特有方法：插入节点
     */
    insertNode(node: ASTNode, position?: number): void {
        if (!this.editor || this.isDestroyed) return

        if (position !== undefined) {
            this.editor.commands.setTextSelection(position)
        }

        const content = this.astToTipTapContent({ root: node } as DocumentAST)
        this.editor.commands.insertContent(content)
    }

    // 视图控制方法
    /**
     * 滚动到节点
     */
    scrollToNode(nodeId: string): void {
        // TODO: 实现滚动到节点
        console.log('Scroll to node:', nodeId)
    }

    /**
     * 放大视图
     */
    zoomIn(): void {
        // 富文本编辑器通常不需要缩放
        console.log('Zoom in')
    }

    /**
     * 缩小视图
     */
    zoomOut(): void {
        // 富文本编辑器通常不需要缩放
        console.log('Zoom out')
    }

    /**
     * 重置缩放
     */
    resetZoom(): void {
        // 富文本编辑器通常不需要缩放
        console.log('Reset zoom')
    }

    /**
     * 适应视图
     */
    fitToView(): void {
        // 富文本编辑器通常不需要适应视图
        console.log('Fit to view')
    }

    /**
     * 获取视口
     */
    getViewport(): any {
        // 富文本编辑器通常不需要获取视口
        return {
            x: 0,
            y: 0,
            width: this.element?.clientWidth || 0,
            height: this.element?.clientHeight || 0,
            zoom: 1
        }
    }

    /**
     * 设置视口
     */
    setViewport(viewport: any): void {
        // 富文本编辑器通常不需要设置视口
        console.log('Set viewport:', viewport)
    }

    // 事件监听方法
    /**
     * 节点点击事件
     */
    onNodeClick(callback: (nodeId: string, event: MouseEvent) => void): void {
        this.addEventListener('nodeClick', callback)
    }

    /**
     * 节点双击事件
     */
    onNodeDoubleClick(callback: (nodeId: string, event: MouseEvent) => void): void {
        this.addEventListener('nodeDoubleClick', callback)
    }

    /**
     * 选择状态变化事件
     */
    onSelectionChange(callback: (selection: Selection) => void): void {
        this.addEventListener('selectionChange', callback)
    }

    /**
     * 视图变化事件
     */
    onViewChange(callback: (viewData: any) => void): void {
        this.addEventListener('viewChange', callback)
    }

    /**
     * 获得焦点事件
     */
    onFocus(callback: () => void): void {
        this.addEventListener('focus', callback)
    }

    /**
     * 失去焦点事件
     */
    onBlur(callback: () => void): void {
        this.addEventListener('blur', callback)
    }

    /**
     * 文本变化事件
     */
    onTextChange(callback: (text: string) => void): void {
        this.addEventListener('textChange', callback)
    }

    /**
     * 格式变化事件
     */
    onFormatChange(callback: (format: TextFormat) => void): void {
        this.addEventListener('formatChange', callback)
    }

    // 私有方法
    private addEventListener(event: string, callback: Function): void {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, [])
        }
        this.eventCallbacks.get(event)!.push(callback)
    }

    /**
     * 触发事件
     */
    private triggerEvent(event: string, data?: any): void {
        const callbacks = this.eventCallbacks.get(event)
        if (callbacks) {
            callbacks.forEach(callback => callback(data))
        }
    }

    /**
     * 处理内容更新
     */
    private handleContentUpdate(editor: any): void {
        const content = editor.getHTML()
        this.triggerEvent('textChange', content)
        this.triggerEvent('viewChange', { content })
    }

    private handleSelectionUpdate(editor: any): void {
        const selection = this.getSelection()
        this.triggerEvent('selectionChange', selection)
    }

    /**
     * 应用主题样式
     */
    private applyTheme(theme: EditorTheme): void {
        if (!this.element) return

        const themeClass = theme === 'auto' ? 'theme-auto' : `theme-${theme}`
        this.element.classList.add(themeClass)
    }

    /**
     * 将AST转换为TipTap可识别的HTML内容
     */
    private astToTipTapContent(ast: DocumentAST): string {
        // 将AST转换为TipTap可识别的HTML内容
        // TODO: 这是一个简化的实现，实际应该递归处理所有节点
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
                return `<p>${this.getNodeContent(node)}</p>`
            // 标题
            case 'heading':
                const level = (node as RichTextNode).attributes?.level || 1
                return `<h${level}>${this.getNodeContent(node)}</h${level}>`
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
                return `<pre><code class="language-${language}">${this.getNodeContent(node)}</code></pre>`
            // 链接
            case 'link':
                const href = (node as RichTextNode).attributes?.href || '#'
                return `<a href="${href}">${this.getNodeContent(node)}</a>`
            // 图片
            case 'image':
                const src = (node as RichTextNode).attributes?.src || ''
                const alt = (node as RichTextNode).attributes?.alt || ''
                return `<img src="${src}" alt="${alt}" />`
            // 列表
            case 'list':
                const ordered = (node as RichTextNode).attributes?.ordered || false
                const tag = ordered ? 'ol' : 'ul'
                return `<${tag}>${this.getChildrenHtml(node)}</${tag}>`
            // 列表项
            case 'listItem':
                return `<li>${this.getNodeContent(node)}</li>`
            // 引用
            case 'blockquote':
                return `<blockquote>${this.getNodeContent(node)}</blockquote>`
            // 表格
            case 'table':
                return `<table>${this.getChildrenHtml(node)}</table>`
            // 表格行
            case 'tableRow':
                return `<tr>${this.getChildrenHtml(node)}</tr>`
            // 表格单元格
            case 'tableCell':
                return `<td>${this.getNodeContent(node)}</td>`
            // 表格头部
            case 'tableHeader':
                return `<th>${this.getNodeContent(node)}</th>`
            // 分割线
            case 'horizontalRule':
                return '<hr />'
            // 其他节点类型
            default:
                return this.getNodeContent(node)
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
        // 递归获取子节点HTML
        return node.children.map(child => this.nodeToHtml(child)).join('')
    }
}

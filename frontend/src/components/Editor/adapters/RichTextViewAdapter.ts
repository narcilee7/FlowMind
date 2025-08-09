/**
 * 富文本视图适配器
 * 基于 TipTap/ProseMirror 实现的富文本编辑器适配器
 * 
 * 功能特性：
 * - 完整的富文本编辑功能
 * - 支持 Markdown 语法
 * - 内置表格、图片、链接等元素
 * - AI 功能集成
 * - 实时协作支持（预留）
 */

import { CoreViewAdapter } from './BaseViewAdapter.optimized'
import { EditorType, SceneTemplate } from '../types/EditorType'
import { DocumentAST, ASTNode, Selection, RichTextNode } from '../types/EditorAST'
import { ViewAdapterOptions, Viewport } from '../types/ViewAdapter'
import { AdapterCapabilities } from '../types/OptimizedViewAdapter'

// TipTap 相关导入
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { Image } from '@tiptap/extension-image'
import { Link } from '@tiptap/extension-link'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { CharacterCount } from '@tiptap/extension-character-count'
import { Typography } from '@tiptap/extension-typography'

// 额外的TipTap扩展
import { TextAlign } from '@tiptap/extension-text-align'
import { Underline } from '@tiptap/extension-underline'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { Highlight } from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { FontFamily } from '@tiptap/extension-font-family'
import { Focus } from '@tiptap/extension-focus'
import { Gapcursor } from '@tiptap/extension-gapcursor'
import { HardBreak } from '@tiptap/extension-hard-break'
import { History } from '@tiptap/extension-history'

/**
 * 富文本适配器配置
 */
export interface RichTextAdapterConfig extends ViewAdapterOptions {
    // 基础配置
    placeholder?: string
    autoFocus?: boolean
    spellCheck?: boolean
    characterLimit?: number

    // 功能开关
    enableMarkdown?: boolean
    enableTables?: boolean
    enableImages?: boolean
    enableTaskLists?: boolean
    enableTypography?: boolean
    enableTextAlign?: boolean
    enableTextStyle?: boolean
    enableHighlight?: boolean
    enableFocus?: boolean
    enableHistory?: boolean

    // 文本样式配置
    enableUnderline?: boolean
    enableSubscript?: boolean
    enableSuperscript?: boolean
    enableColor?: boolean
    enableFontFamily?: boolean

    // 表格配置
    tableResizable?: boolean
    tableCellSelection?: boolean

    // 图片配置
    imageUploadUrl?: string
    imageAllowBase64?: boolean
    imageInline?: boolean

    // 链接配置
    linkOpenOnClick?: boolean
    linkAutolink?: boolean

    // 历史配置
    historyDepth?: number
    historyNewGroupDelay?: number

    // 字符统计配置
    showCharacterCount?: boolean
    showWordCount?: boolean
}

/**
 * 富文本视图适配器实现
 */
export class RichTextViewAdapter extends CoreViewAdapter {
    // === 适配器属性 ===
    public readonly type = EditorType.RICH_TEXT
    public readonly capabilities: AdapterCapabilities = {
        canEdit: true,
        canSelect: true,
        canZoom: false,
        canDrag: false,
        supportsUndo: true,
        supportsSearch: true,
        supportsAI: true
    }

    // === TipTap 编辑器实例 ===
    private editor: Editor | null = null
    private config: Partial<RichTextAdapterConfig> = {}

    // === 状态追踪 ===
    private isInitializing = false
    private lastSelection: Selection = { nodeIds: [], type: 'node' }
    private nodeMap: Map<string, any> = new Map() // AST nodeId 到 ProseMirror 位置的映射

    constructor(sceneTemplate: SceneTemplate) {
        super(sceneTemplate)
    }

    // === 核心生命周期方法 ===

    /**
     * 创建富文本编辑器
     */
    protected async performCreate(element: HTMLElement, options: ViewAdapterOptions): Promise<void> {
        this.config = { ...this.getDefaultConfig(), ...options } as RichTextAdapterConfig
        this.isInitializing = true

        try {
            // 创建编辑器容器
            const editorContainer = this.createEditorContainer(element)

            // 初始化 TipTap 编辑器
            this.editor = new Editor({
                element: editorContainer,
                extensions: this.createExtensions(),
                content: this.getInitialContent(),
                editorProps: this.getEditorProps(),
                onUpdate: ({ editor }: any) => {
                    this.handleContentUpdate(editor)
                },
                onSelectionUpdate: ({ editor }: any) => {
                    this.handleSelectionUpdate(editor)
                },
                onFocus: () => {
                    this.emit('focus')
                },
                onBlur: () => {
                    this.emit('blur')
                },
                onCreate: ({ editor }: any) => {
                    this.handleEditorCreated(editor)
                },
                onDestroy: () => {
                    this.handleEditorDestroyed()
                }
            })

            // 应用主题样式
            this.applyThemeStyles(element)

            console.log('[RichTextAdapter] Created successfully')
        } catch (error) {
            console.error('[RichTextAdapter] Creation failed:', error)
            throw error
        } finally {
            this.isInitializing = false
        }
    }

    /**
     * 销毁富文本编辑器
     */
    protected performDestroy(): void {
        try {
            if (this.editor) {
                this.editor.destroy()
                this.editor = null
            }

            // 清理状态
            this.lastSelection = { nodeIds: [], type: 'node' }

            console.log('[RichTextAdapter] Destroyed successfully')
        } catch (error) {
            console.error('[RichTextAdapter] Destroy failed:', error)
            throw error
        }
    }

    /**
     * 渲染 AST 到编辑器
     */
    protected performRender(ast: DocumentAST): void {
        if (!this.editor || this.isInitializing) {
            console.warn('[RichTextAdapter] Editor not ready for rendering')
            return
        }

        try {
            // 将 AST 转换为 TipTap 格式
            const content = this.astToTipTapContent(ast)

            // 设置编辑器内容
            this.editor.commands.setContent(content)

            console.debug('[RichTextAdapter] Rendered AST successfully')
        } catch (error) {
            console.error('[RichTextAdapter] Render failed:', error)
            throw error
        }
    }

    // === 节点操作方法 ===

    protected performUpdateNode(nodeId: string, node: ASTNode): void {
        if (!this.editor) return

        try {
            // 查找节点在文档中的位置
            const nodePos = this.findNodePositionByASTId(nodeId)
            if (nodePos === null) {
                console.warn('[RichTextAdapter] Node not found:', nodeId)
                return
            }

            // 将AST节点转换为TipTap格式
            const tipTapContent = this.astNodeToTipTapContent(node)

            // 替换节点内容
            this.editor.commands.deleteRange({ from: nodePos.from, to: nodePos.to })
            this.editor.commands.insertContentAt(nodePos.from, tipTapContent)

            // 更新节点映射
            this.updateNodeMapping(nodeId, nodePos.from)

            console.debug('[RichTextAdapter] Updated node:', nodeId)
        } catch (error) {
            console.error('[RichTextAdapter] Update node failed:', error)
            throw error
        }
    }

    protected performRemoveNode(nodeId: string): void {
        if (!this.editor) return

        try {
            const nodePos = this.findNodePositionByASTId(nodeId)
            if (nodePos === null) {
                console.warn('[RichTextAdapter] Node not found for removal:', nodeId)
                return
            }

            // 删除节点
            this.editor.commands.deleteRange({ from: nodePos.from, to: nodePos.to })

            // 从映射中移除
            this.nodeMap.delete(nodeId)

            console.debug('[RichTextAdapter] Removed node:', nodeId)
        } catch (error) {
            console.error('[RichTextAdapter] Remove node failed:', error)
            throw error
        }
    }

    protected performAddNode(node: ASTNode, parentId?: string, index?: number): void {
        if (!this.editor) return

        try {
            const tipTapContent = this.astNodeToTipTapContent(node)
            let insertPos = this.editor.state.selection.from

            if (parentId) {
                const parentPos = this.findNodePositionByASTId(parentId)
                if (parentPos) {
                    // 在父节点内部的指定位置插入
                    insertPos = index !== undefined
                        ? parentPos.from + Math.min(index, parentPos.to - parentPos.from)
                        : parentPos.to - 1
                }
            }

            // 插入内容
            this.editor.commands.insertContentAt(insertPos, tipTapContent)

            // 更新节点映射
            this.updateNodeMapping(node.id, insertPos)

            console.debug('[RichTextAdapter] Added node:', node.id)
        } catch (error) {
            console.error('[RichTextAdapter] Add node failed:', error)
            throw error
        }
    }

    // === 选择和焦点管理 ===

    protected performSetSelection(selection: Selection): void {
        if (!this.editor) return

        try {
            if (selection.range) {
                this.editor.commands.setTextSelection({
                    from: selection.range.start,
                    to: selection.range.end
                })
            }
            this.lastSelection = selection
        } catch (error) {
            console.error('[RichTextAdapter] Set selection failed:', error)
            throw error
        }
    }

    protected performGetSelection(): Selection {
        if (!this.editor) return this.lastSelection

        try {
            const { from, to } = this.editor.state.selection
            return {
                nodeIds: [],
                range: {
                    start: from,
                    end: to,
                    nodeId: 'editor-root'
                },
                type: from === to ? 'node' : 'text'
            }
        } catch (error) {
            console.error('[RichTextAdapter] Get selection failed:', error)
            return this.lastSelection
        }
    }

    protected performFocus(): void {
        if (this.editor) {
            this.editor.commands.focus()
        }
    }

    protected performBlur(): void {
        if (this.editor) {
            this.editor.commands.blur()
        }
    }

    // === 视口管理 ===

    protected performGetViewport(): Viewport {
        const element = this.element
        if (!element) {
            return { x: 0, y: 0, width: 0, height: 0, zoom: 1 }
        }

        const rect = element.getBoundingClientRect()
        return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            zoom: 1
        }
    }

    protected performSetViewport(_viewport: Viewport): void {
        // 富文本编辑器不支持视口操作
        console.debug('[RichTextAdapter] Viewport operations not supported')
    }

    // === 私有辅助方法 ===

    /**
     * 获取默认配置
     */
    private getDefaultConfig(): Partial<RichTextAdapterConfig> {
        return {
            // 基础配置
            placeholder: '开始输入...',
            autoFocus: false,
            spellCheck: true,
            characterLimit: undefined,
            theme: 'auto',

            // 功能开关
            enableMarkdown: true,
            enableTables: true,
            enableImages: true,
            enableTaskLists: true,
            enableTypography: true,
            enableTextAlign: true,
            enableTextStyle: true,
            enableHighlight: true,
            enableFocus: true,
            enableHistory: true,

            // 文本样式配置
            enableUnderline: true,
            enableSubscript: true,
            enableSuperscript: true,
            enableColor: true,
            enableFontFamily: true,

            // 表格配置
            tableResizable: true,
            tableCellSelection: true,

            // 图片配置
            imageAllowBase64: true,
            imageInline: true,

            // 链接配置
            linkOpenOnClick: false,
            linkAutolink: true,

            // 历史配置
            historyDepth: 100,
            historyNewGroupDelay: 500,

            // 字符统计配置
            showCharacterCount: true,
            showWordCount: true
        }
    }

    /**
     * 创建编辑器容器
     */
    private createEditorContainer(parent: HTMLElement): HTMLElement {
        const container = document.createElement('div')
        container.className = 'rich-text-editor-container'
        container.style.cssText = `
            width: 100%;
            height: 100%;
            overflow: auto;
            padding: 1rem;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
        `
        parent.appendChild(container)
        return container
    }

    /**
     * 创建 TipTap 扩展
     */
    private createExtensions() {
        const extensions: any[] = []

        // 基础扩展包 - 但我们需要单独配置历史
        extensions.push(
            StarterKit.configure({
                // StarterKit 的默认配置
            })
        )

        // 添加历史扩展
        if (this.config.enableHistory) {
            extensions.push(
                History.configure({
                    depth: this.config.historyDepth || 100,
                    newGroupDelay: this.config.historyNewGroupDelay || 500,
                })
            )
        }

        // 添加占位符
        if (this.config.placeholder) {
            extensions.push(
                Placeholder.configure({
                    placeholder: this.config.placeholder,
                })
            )
        }

        // 添加文本样式扩展
        if (this.config.enableTextStyle) {
            extensions.push(TextStyle)
        }

        // 添加下划线支持
        if (this.config.enableUnderline) {
            extensions.push(Underline)
        }

        // 添加上标下标支持
        if (this.config.enableSubscript) {
            extensions.push(Subscript)
        }
        if (this.config.enableSuperscript) {
            extensions.push(Superscript)
        }

        // 添加高亮支持
        if (this.config.enableHighlight) {
            extensions.push(
                Highlight.configure({
                    multicolor: true,
                })
            )
        }

        // 添加颜色支持
        if (this.config.enableColor) {
            extensions.push(Color)
        }

        // 添加字体支持
        if (this.config.enableFontFamily) {
            extensions.push(
                FontFamily.configure({
                    types: ['textStyle'],
                })
            )
        }

        // 添加文本对齐支持
        if (this.config.enableTextAlign) {
            extensions.push(
                TextAlign.configure({
                    types: ['heading', 'paragraph'],
                    alignments: ['left', 'center', 'right', 'justify'],
                    defaultAlignment: 'left',
                })
            )
        }

        // 添加表格支持
        if (this.config.enableTables) {
            extensions.push(
                Table.configure({
                    resizable: this.config.tableResizable !== false,
                    HTMLAttributes: {
                        class: 'editor-table',
                    },
                }),
                TableRow.configure({
                    HTMLAttributes: {
                        class: 'editor-table-row',
                    },
                }),
                TableHeader.configure({
                    HTMLAttributes: {
                        class: 'editor-table-header',
                    },
                }),
                TableCell.configure({
                    HTMLAttributes: {
                        class: 'editor-table-cell',
                    },
                })
            )
        }

        // 添加图片支持
        if (this.config.enableImages) {
            extensions.push(
                Image.configure({
                    inline: this.config.imageInline !== false,
                    allowBase64: this.config.imageAllowBase64 !== false,
                    HTMLAttributes: {
                        class: 'editor-image',
                    },
                })
            )
        }

        // 添加链接支持
        extensions.push(
            Link.configure({
                openOnClick: this.config.linkOpenOnClick === true,
                autolink: this.config.linkAutolink !== false,
                HTMLAttributes: {
                    class: 'editor-link',
                    rel: 'noopener noreferrer',
                    target: '_blank',
                },
            })
        )

        // 添加任务列表支持
        if (this.config.enableTaskLists) {
            extensions.push(
                TaskList.configure({
                    HTMLAttributes: {
                        class: 'editor-task-list',
                    },
                }),
                TaskItem.configure({
                    nested: true,
                    HTMLAttributes: {
                        class: 'editor-task-item',
                    },
                })
            )
        }

        // 添加字符统计
        if (this.config.characterLimit || this.config.showCharacterCount || this.config.showWordCount) {
            extensions.push(
                CharacterCount.configure({
                    limit: this.config.characterLimit,
                })
            )
        }

        // 添加排版增强
        if (this.config.enableTypography) {
            extensions.push(Typography)
        }

        // 添加焦点支持
        if (this.config.enableFocus) {
            extensions.push(
                Focus.configure({
                    className: 'editor-focus',
                    mode: 'all',
                })
            )
        }

        // 添加其他实用扩展
        extensions.push(
            Gapcursor, // 光标位置优化
            HardBreak  // 硬换行支持
        )

        return extensions
    }

    /**
     * 获取编辑器属性
     */
    private getEditorProps() {
        return {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
                spellcheck: this.config.spellCheck ? 'true' : 'false',
            },
        }
    }

    /**
     * 获取初始内容
     */
    private getInitialContent(): string {
        // 根据场景模板返回不同的初始内容
        switch (this.sceneTemplate) {
            case SceneTemplate.WRITING:
                return '<h1>开始写作</h1><p>在这里记录你的想法...</p>'
            case SceneTemplate.RESEARCH:
                return '<h1>研究笔记</h1><p>整理和分析研究资料...</p>'
            case SceneTemplate.LEARNING:
                return '<h1>学习笔记</h1><p>记录学习要点和心得...</p>'
            default:
                return '<p>开始编辑...</p>'
        }
    }

    /**
     * 应用主题样式
     */
    private applyThemeStyles(element: HTMLElement): void {
        const theme = this.config.theme || 'auto'
        element.setAttribute('data-theme', theme)

        // 添加主题相关的 CSS 类
        element.classList.add('rich-text-editor')
        if (theme !== 'auto') {
            element.classList.add(`theme-${theme}`)
        }
    }

    /**
     * 处理内容更新
     */
    private handleContentUpdate(editor: Editor): void {
        try {
            // 将 TipTap 内容转换为 AST
            const ast = this.tipTapContentToAST(editor.getJSON())

            // 触发内容变化事件
            this.emit('viewChange', {
                type: 'contentUpdate',
                ast,
                content: editor.getHTML(),
                text: editor.getText(),
                characterCount: editor.storage.characterCount?.characters() || 0,
                wordCount: editor.storage.characterCount?.words() || 0
            })
        } catch (error) {
            console.error('[RichTextAdapter] Content update handling failed:', error)
            this.emit('error', error as Error)
        }
    }

    /**
     * 处理选择更新
     */
    private handleSelectionUpdate(_editor: Editor): void {
        try {
            const selection = this.performGetSelection()
            this.lastSelection = selection
            this.emit('selectionChange', selection)
        } catch (error) {
            console.error('[RichTextAdapter] Selection update handling failed:', error)
            this.emit('error', error as Error)
        }
    }

    /**
     * 处理编辑器创建完成
     */
    private handleEditorCreated(_editor: Editor): void {
        console.debug('[RichTextAdapter] Editor created successfully')

        // 自动聚焦
        if (this.config.autoFocus && this.editor) {
            setTimeout(() => this.editor?.commands.focus(), 100)
        }
    }

    /**
     * 处理编辑器销毁
     */
    private handleEditorDestroyed(): void {
        console.debug('[RichTextAdapter] Editor destroyed')
    }

    // === AST 转换方法 ===

    /**
     * 将 AST 转换为 TipTap 内容
     */
    private astToTipTapContent(ast: DocumentAST): any {
        return {
            type: 'doc',
            content: this.astNodeToTipTapContent(ast.root)
        }
    }

    /**
     * 将 AST 节点转换为 TipTap 内容
     */
    private astNodeToTipTapContent(node: ASTNode): any {
        const richTextNode = node as RichTextNode

        // 处理不同类型的节点
        switch (richTextNode.type) {
            case 'paragraph':
                return {
                    type: 'paragraph',
                    attrs: this.extractAttributes(richTextNode),
                    content: this.processChildren(richTextNode)
                }

            case 'heading':
                return {
                    type: 'heading',
                    attrs: {
                        level: richTextNode.attributes?.level || 1,
                        textAlign: richTextNode.attributes?.textAlign || 'left'
                    },
                    content: this.processChildren(richTextNode)
                }

            case 'text':
                return {
                    type: 'text',
                    text: richTextNode.content || '',
                    marks: this.convertMarks(richTextNode.marks || [])
                }

            case 'bold':
                return {
                    type: 'text',
                    text: richTextNode.content || '',
                    marks: [{ type: 'bold' }]
                }

            case 'italic':
                return {
                    type: 'text',
                    text: richTextNode.content || '',
                    marks: [{ type: 'italic' }]
                }

            case 'underline':
                return {
                    type: 'text',
                    text: richTextNode.content || '',
                    marks: [{ type: 'underline' }]
                }

            case 'strikethrough':
                return {
                    type: 'text',
                    text: richTextNode.content || '',
                    marks: [{ type: 'strike' }]
                }

            case 'code':
                return {
                    type: 'text',
                    text: richTextNode.content || '',
                    marks: [{ type: 'code' }]
                }

            case 'codeBlock':
                return {
                    type: 'codeBlock',
                    attrs: {
                        language: richTextNode.attributes?.language || null
                    },
                    content: [{
                        type: 'text',
                        text: richTextNode.content || ''
                    }]
                }

            case 'link':
                return {
                    type: 'text',
                    text: richTextNode.content || '',
                    marks: [{
                        type: 'link',
                        attrs: {
                            href: richTextNode.attributes?.href || '#',
                            target: richTextNode.attributes?.target || '_blank'
                        }
                    }]
                }

            case 'image':
                return {
                    type: 'image',
                    attrs: {
                        src: richTextNode.attributes?.src || '',
                        alt: richTextNode.attributes?.alt || '',
                        title: richTextNode.attributes?.title || ''
                    }
                }

            case 'list':
                return {
                    type: richTextNode.attributes?.ordered ? 'orderedList' : 'bulletList',
                    content: this.processChildren(richTextNode)
                }

            case 'listItem':
                return {
                    type: 'listItem',
                    content: this.processChildren(richTextNode)
                }

            case 'blockquote':
                return {
                    type: 'blockquote',
                    content: this.processChildren(richTextNode)
                }

            case 'table':
                return {
                    type: 'table',
                    content: this.processChildren(richTextNode)
                }

            case 'tableRow':
                return {
                    type: 'tableRow',
                    content: this.processChildren(richTextNode)
                }

            case 'tableCell':
                return {
                    type: 'tableCell',
                    attrs: {
                        colspan: richTextNode.attributes?.colspan || 1,
                        rowspan: richTextNode.attributes?.rowspan || 1,
                        colwidth: richTextNode.attributes?.colwidth || null
                    },
                    content: this.processChildren(richTextNode)
                }

            case 'horizontalRule':
                return {
                    type: 'horizontalRule'
                }

            default:
                // 对于未知类型，创建段落
                return {
                    type: 'paragraph',
                    content: richTextNode.content ? [{
                        type: 'text',
                        text: richTextNode.content
                    }] : this.processChildren(richTextNode)
                }
        }
    }

    /**
     * 处理子节点
     */
    private processChildren(node: ASTNode): any[] {
        if (!node.children || node.children.length === 0) {
            const richTextNode = node as RichTextNode
            if (richTextNode.content) {
                return [{
                    type: 'text',
                    text: richTextNode.content
                }]
            }
            return []
        }

        return node.children.map(child => this.astNodeToTipTapContent(child))
    }

    /**
     * 提取节点属性
     */
    private extractAttributes(node: RichTextNode): any {
        const attrs: any = {}

        if (node.attributes) {
            // 文本对齐
            if (node.attributes.textAlign) {
                attrs.textAlign = node.attributes.textAlign
            }

            // 其他属性
            Object.keys(node.attributes).forEach(key => {
                if (key !== 'textAlign') {
                    attrs[key] = node.attributes![key]
                }
            })
        }

        return Object.keys(attrs).length > 0 ? attrs : undefined
    }

    /**
     * 转换标记
     */
    private convertMarks(marks: any[]): any[] {
        return marks.map(mark => {
            if (typeof mark === 'string') {
                return { type: mark }
            }
            return mark
        })
    }

    /**
     * 将 TipTap 内容转换为 AST
     */
    private tipTapContentToAST(content: any): DocumentAST {
        const rootNode = this.tipTapNodeToAST(content, 'root')

        return {
            version: '1.0.0',
            type: 'document',
            id: `doc_${Date.now()}`,
            title: this.extractDocumentTitle(content),
            root: rootNode,
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                sceneTemplate: this.sceneTemplate
            }
        }
    }

    /**
     * 将 TipTap 节点转换为 AST 节点
     */
    private tipTapNodeToAST(node: any, nodeId?: string): ASTNode {
        const id = nodeId || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // 基础节点结构
        const baseNode: ASTNode = {
            id,
            type: node.type || 'paragraph',
            position: { x: 0, y: 0 },
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        }

        // 处理不同类型的TipTap节点
        switch (node.type) {
            case 'doc':
                return {
                    ...baseNode,
                    type: 'paragraph', // 使用有效的AST节点类型
                    children: node.content ? node.content.map((child: any) => this.tipTapNodeToAST(child)) : []
                }

            case 'paragraph':
                return {
                    ...baseNode,
                    type: 'paragraph',
                    attributes: node.attrs,
                    children: node.content ? node.content.map((child: any) => this.tipTapNodeToAST(child)) : []
                } as RichTextNode

            case 'heading':
                return {
                    ...baseNode,
                    type: 'heading',
                    attributes: {
                        level: node.attrs?.level || 1,
                        textAlign: node.attrs?.textAlign
                    },
                    children: node.content ? node.content.map((child: any) => this.tipTapNodeToAST(child)) : []
                } as RichTextNode

            case 'text':
                const marks = node.marks ? node.marks.map((mark: any) => ({
                    type: mark.type,
                    attributes: mark.attrs || {}
                })) : []

                return {
                    ...baseNode,
                    type: 'text',
                    content: node.text || '',
                    marks
                } as RichTextNode

            case 'codeBlock':
                return {
                    ...baseNode,
                    type: 'codeBlock',
                    content: node.content?.[0]?.text || '',
                    attributes: {
                        language: node.attrs?.language
                    }
                } as RichTextNode

            case 'image':
                return {
                    ...baseNode,
                    type: 'image',
                    attributes: {
                        src: node.attrs?.src,
                        alt: node.attrs?.alt,
                        title: node.attrs?.title
                    }
                } as RichTextNode

            case 'bulletList':
            case 'orderedList':
                return {
                    ...baseNode,
                    type: 'list',
                    attributes: {
                        ordered: node.type === 'orderedList'
                    },
                    children: node.content ? node.content.map((child: any) => this.tipTapNodeToAST(child)) : []
                } as RichTextNode

            case 'listItem':
                return {
                    ...baseNode,
                    type: 'listItem',
                    children: node.content ? node.content.map((child: any) => this.tipTapNodeToAST(child)) : []
                } as RichTextNode

            case 'blockquote':
                return {
                    ...baseNode,
                    type: 'blockquote',
                    children: node.content ? node.content.map((child: any) => this.tipTapNodeToAST(child)) : []
                } as RichTextNode

            case 'table':
                return {
                    ...baseNode,
                    type: 'table',
                    children: node.content ? node.content.map((child: any) => this.tipTapNodeToAST(child)) : []
                } as RichTextNode

            case 'tableRow':
                return {
                    ...baseNode,
                    type: 'tableRow',
                    children: node.content ? node.content.map((child: any) => this.tipTapNodeToAST(child)) : []
                } as RichTextNode

            case 'tableCell':
            case 'tableHeader':
                return {
                    ...baseNode,
                    type: 'tableCell',
                    attributes: {
                        colspan: node.attrs?.colspan,
                        rowspan: node.attrs?.rowspan,
                        colwidth: node.attrs?.colwidth,
                        isHeader: node.type === 'tableHeader'
                    },
                    children: node.content ? node.content.map((child: any) => this.tipTapNodeToAST(child)) : []
                } as RichTextNode

            case 'horizontalRule':
                return {
                    ...baseNode,
                    type: 'horizontalRule'
                } as RichTextNode

            default:
                return {
                    ...baseNode,
                    type: 'paragraph',
                    content: node.text || '',
                    children: node.content ? node.content.map((child: any) => this.tipTapNodeToAST(child)) : []
                } as RichTextNode
        }
    }

    /**
     * 提取文档标题
     */
    private extractDocumentTitle(content: any): string {
        if (content.content && content.content.length > 0) {
            const firstNode = content.content[0]
            if (firstNode.type === 'heading' && firstNode.content) {
                return firstNode.content.map((child: any) => child.text || '').join('')
            }
        }
        return '无标题文档'
    }

    /**
     * 查找节点位置（通过AST ID）
     */
    private findNodePositionByASTId(nodeId: string): { from: number; to: number } | null {
        if (!this.editor) return null

        // 从映射中查找
        const position = this.nodeMap.get(nodeId)
        if (position) {
            return position
        }

        // TODO: 实现更复杂的位置查找逻辑
        // 这里可以通过遍历ProseMirror文档来查找包含特定AST ID的节点
        return null
    }

    /**
     * 更新节点映射
     */
    private updateNodeMapping(nodeId: string, position: number): void {
        this.nodeMap.set(nodeId, {
            from: position,
            to: position + 1 // 简化实现，实际应该计算节点的实际长度
        })
    }





    // === 公开的便利方法 ===

    /**
     * 获取编辑器实例（用于高级操作）
     */
    public getEditor(): Editor | null {
        return this.editor
    }

    /**
     * 获取编辑器内容（HTML）
     */
    public getHTML(): string {
        return this.editor?.getHTML() || ''
    }

    /**
     * 获取编辑器内容（文本）
     */
    public getText(): string {
        return this.editor?.getText() || ''
    }

    /**
     * 获取编辑器内容（JSON）
     */
    public getJSON(): any {
        return this.editor?.getJSON() || {}
    }

    /**
     * 设置编辑器内容
     */
    public setContent(content: string | any): void {
        if (this.editor) {
            this.editor.commands.setContent(content)
        }
    }

    /**
     * 插入内容
     */
    public insertContent(content: string | any): void {
        if (this.editor) {
            this.editor.commands.insertContent(content)
        }
    }

    /**
     * 获取字符统计
     */
    public getCharacterCount(): { characters: number; words: number } {
        if (this.editor?.storage.characterCount) {
            return {
                characters: this.editor.storage.characterCount.characters(),
                words: this.editor.storage.characterCount.words()
            }
        }
        return { characters: 0, words: 0 }
    }

    /**
     * 检查编辑器是否为空
     */
    public isEmpty(): boolean {
        return this.editor?.isEmpty ?? true
    }

    /**
     * 检查是否可以撤销
     */
    public canUndo(): boolean {
        return this.editor?.can().undo() ?? false
    }

    /**
     * 检查是否可以重做
     */
    public canRedo(): boolean {
        return this.editor?.can().redo() ?? false
    }

    /**
     * 撤销操作
     */
    public undo(): void {
        this.editor?.commands.undo()
    }

    /**
     * 重做操作
     */
    public redo(): void {
        this.editor?.commands.redo()
    }

    // === 富文本格式化方法 ===

    /**
     * 切换粗体
     */
    public toggleBold(): void {
        this.editor?.commands.toggleBold()
    }

    /**
     * 切换斜体
     */
    public toggleItalic(): void {
        this.editor?.commands.toggleItalic()
    }

    /**
     * 切换下划线
     */
    public toggleUnderline(): void {
        this.editor?.commands.toggleUnderline()
    }

    /**
     * 切换删除线
     */
    public toggleStrike(): void {
        this.editor?.commands.toggleStrike()
    }

    /**
     * 切换代码
     */
    public toggleCode(): void {
        this.editor?.commands.toggleCode()
    }

    /**
     * 设置标题级别
     */
    public setHeading(level: 1 | 2 | 3 | 4 | 5 | 6): void {
        this.editor?.commands.setHeading({ level })
    }

    /**
     * 设置段落
     */
    public setParagraph(): void {
        this.editor?.commands.setParagraph()
    }

    /**
     * 切换项目符号列表
     */
    public toggleBulletList(): void {
        this.editor?.commands.toggleBulletList()
    }

    /**
     * 切换有序列表
     */
    public toggleOrderedList(): void {
        this.editor?.commands.toggleOrderedList()
    }

    /**
     * 切换任务列表
     */
    public toggleTaskList(): void {
        this.editor?.commands.toggleTaskList()
    }

    /**
     * 切换引用
     */
    public toggleBlockquote(): void {
        this.editor?.commands.toggleBlockquote()
    }

    /**
     * 设置代码块
     */
    public setCodeBlock(language?: string): void {
        if (language) {
            this.editor?.commands.setCodeBlock({ language })
        } else {
            this.editor?.commands.setCodeBlock()
        }
    }

    /**
     * 插入水平分割线
     */
    public setHorizontalRule(): void {
        this.editor?.commands.setHorizontalRule()
    }

    /**
     * 设置文本对齐
     */
    public setTextAlign(alignment: 'left' | 'center' | 'right' | 'justify'): void {
        this.editor?.commands.setTextAlign(alignment)
    }

    /**
     * 设置文本颜色
     */
    public setColor(color: string): void {
        this.editor?.commands.setColor(color)
    }

    /**
     * 设置高亮颜色
     */
    public setHighlight(color?: string): void {
        if (color) {
            this.editor?.commands.setHighlight({ color })
        } else {
            this.editor?.commands.toggleHighlight()
        }
    }

    /**
     * 切换上标
     */
    public toggleSuperscript(): void {
        this.editor?.commands.toggleSuperscript()
    }

    /**
     * 切换下标
     */
    public toggleSubscript(): void {
        this.editor?.commands.toggleSubscript()
    }

    /**
     * 设置字体
     */
    public setFontFamily(fontFamily: string): void {
        this.editor?.commands.setFontFamily(fontFamily)
    }

    // === 表格操作方法 ===

    /**
     * 插入表格
     */
    public insertTable(rows = 3, cols = 3, withHeaderRow = true): void {
        this.editor?.commands.insertTable({
            rows,
            cols,
            withHeaderRow
        })
    }

    /**
     * 删除表格
     */
    public deleteTable(): void {
        this.editor?.commands.deleteTable()
    }

    /**
     * 添加行（在下方）
     */
    public addRowAfter(): void {
        this.editor?.commands.addRowAfter()
    }

    /**
     * 添加行（在上方）
     */
    public addRowBefore(): void {
        this.editor?.commands.addRowBefore()
    }

    /**
     * 删除行
     */
    public deleteRow(): void {
        this.editor?.commands.deleteRow()
    }

    /**
     * 添加列（在右侧）
     */
    public addColumnAfter(): void {
        this.editor?.commands.addColumnAfter()
    }

    /**
     * 添加列（在左侧）
     */
    public addColumnBefore(): void {
        this.editor?.commands.addColumnBefore()
    }

    /**
     * 删除列
     */
    public deleteColumn(): void {
        this.editor?.commands.deleteColumn()
    }

    /**
     * 合并单元格
     */
    public mergeCells(): void {
        this.editor?.commands.mergeCells()
    }

    /**
     * 拆分单元格
     */
    public splitCell(): void {
        this.editor?.commands.splitCell()
    }

    /**
     * 切换表头行
     */
    public toggleHeaderRow(): void {
        this.editor?.commands.toggleHeaderRow()
    }

    /**
     * 切换表头列
     */
    public toggleHeaderColumn(): void {
        this.editor?.commands.toggleHeaderColumn()
    }

    // === 链接和图片操作方法 ===

    /**
     * 设置链接
     */
    public setLink(href: string, target?: string): void {
        this.editor?.commands.setLink({ href, target })
    }

    /**
     * 取消链接
     */
    public unsetLink(): void {
        this.editor?.commands.unsetLink()
    }

    /**
     * 插入图片
     */
    public insertImage(src: string, alt?: string, title?: string): void {
        this.editor?.commands.setImage({ src, alt, title })
    }

    // === 内容操作方法 ===

    /**
     * 全选
     */
    public selectAll(): void {
        this.editor?.commands.selectAll()
    }

    /**
     * 删除选中内容
     */
    public deleteSelection(): void {
        this.editor?.commands.deleteSelection()
    }

    /**
     * 在当前位置插入换行
     */
    public insertHardBreak(): void {
        this.editor?.commands.setHardBreak()
    }

    /**
     * 清除格式
     */
    public clearFormat(): void {
        this.editor?.commands.unsetAllMarks()
    }

    /**
     * 获取当前格式状态
     */
    public getFormatState(): any {
        if (!this.editor) return {}

        return {
            isBold: this.editor.isActive('bold'),
            isItalic: this.editor.isActive('italic'),
            isUnderline: this.editor.isActive('underline'),
            isStrike: this.editor.isActive('strike'),
            isCode: this.editor.isActive('code'),
            isCodeBlock: this.editor.isActive('codeBlock'),
            isBulletList: this.editor.isActive('bulletList'),
            isOrderedList: this.editor.isActive('orderedList'),
            isTaskList: this.editor.isActive('taskList'),
            isBlockquote: this.editor.isActive('blockquote'),
            heading: this.editor.isActive('heading') ? this.editor.getAttributes('heading').level : null,
            textAlign: this.editor.getAttributes('paragraph').textAlign || 'left',
            color: this.editor.getAttributes('textStyle').color,
            highlight: this.editor.getAttributes('highlight').color,
            fontFamily: this.editor.getAttributes('textStyle').fontFamily,
            isSubscript: this.editor.isActive('subscript'),
            isSuperscript: this.editor.isActive('superscript'),
            isLink: this.editor.isActive('link'),
            linkHref: this.editor.getAttributes('link').href
        }
    }

    // === 搜索和替换方法 ===

    /**
     * 查找文本
     */
    public findText(searchTerm: string): boolean {
        if (!this.editor || !searchTerm) return false

        const doc = this.editor.state.doc
        const text = doc.textContent.toLowerCase()
        const searchText = searchTerm.toLowerCase()

        return text.includes(searchText)
    }

    /**
     * 替换文本
     */
    public replaceText(searchTerm: string, replacement: string): boolean {
        if (!this.editor || !searchTerm) return false

        const content = this.editor.getHTML()
        if (content.includes(searchTerm)) {
            const newContent = content.replace(new RegExp(searchTerm, 'g'), replacement)
            this.editor.commands.setContent(newContent)
            return true
        }

        return false
    }

    // === 导出方法 ===

    /**
     * 导出为 Markdown
     */
    public exportToMarkdown(): string {
        // TODO: 实现更完整的Markdown导出
        // 这里需要一个TipTap到Markdown的转换器
        const content = this.getText()
        return content
    }

    /**
     * 导出为纯HTML
     */
    public exportToHTML(): string {
        return this.getHTML()
    }

    /**
     * 导出统计信息
     */
    public getDocumentStats(): {
        characters: number
        words: number
        paragraphs: number
        headings: number
        lists: number
        tables: number
        images: number
        links: number
    } {
        if (!this.editor) {
            return {
                characters: 0,
                words: 0,
                paragraphs: 0,
                headings: 0,
                lists: 0,
                tables: 0,
                images: 0,
                links: 0
            }
        }

        const { characters, words } = this.getCharacterCount()
        const doc = this.editor.state.doc

        let paragraphs = 0
        let headings = 0
        let lists = 0
        let tables = 0
        let images = 0
        let links = 0

        // 遍历文档统计不同类型的节点
        doc.descendants((node) => {
            switch (node.type.name) {
                case 'paragraph':
                    paragraphs++
                    break
                case 'heading':
                    headings++
                    break
                case 'bulletList':
                case 'orderedList':
                case 'taskList':
                    lists++
                    break
                case 'table':
                    tables++
                    break
                case 'image':
                    images++
                    break
            }

            // 统计链接标记
            node.marks.forEach(mark => {
                if (mark.type.name === 'link') {
                    links++
                }
            })
        })

        return {
            characters,
            words,
            paragraphs,
            headings,
            lists,
            tables,
            images,
            links
        }
    }
}
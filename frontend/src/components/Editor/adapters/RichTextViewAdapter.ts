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

/**
 * 富文本适配器配置
 */
export interface RichTextAdapterConfig extends ViewAdapterOptions {
    placeholder?: string
    enableMarkdown?: boolean
    enableTables?: boolean
    enableImages?: boolean
    enableTaskLists?: boolean
    enableTypography?: boolean
    characterLimit?: number
    autoFocus?: boolean
    spellCheck?: boolean
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

    protected performUpdateNode(nodeId: string, _node: ASTNode): void {
        if (!this.editor) return

        try {
            // 查找并更新节点
            // 简化的节点更新实现
            // 实际项目中需要根据具体需求实现节点查找和更新逻辑
            console.debug('[RichTextAdapter] Node update requested for:', nodeId)
        } catch (error) {
            console.error('[RichTextAdapter] Update node failed:', error)
            throw error
        }
    }

    protected performRemoveNode(nodeId: string): void {
        if (!this.editor) return

        try {
            const position = this.findNodePosition(nodeId)
            if (position !== null) {
                this.editor.commands.deleteRange({ from: position, to: position + 1 })
            }
        } catch (error) {
            console.error('[RichTextAdapter] Remove node failed:', error)
            throw error
        }
    }

    protected performAddNode(node: ASTNode, parentId?: string, _index?: number): void {
        if (!this.editor) return

        try {
            const tipTapNode = this.astNodeToTipTap(node)

            if (parentId) {
                const parentPosition = this.findNodePosition(parentId)
                if (parentPosition !== null) {
                    this.editor.commands.insertContentAt(parentPosition, tipTapNode)
                }
            } else {
                // 在当前位置插入
                this.editor.commands.insertContent(tipTapNode)
            }
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
            placeholder: '开始输入...',
            enableMarkdown: true,
            enableTables: true,
            enableImages: true,
            enableTaskLists: true,
            enableTypography: true,
            characterLimit: undefined,
            autoFocus: false,
            spellCheck: true,
            theme: 'auto'
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
        const extensions: any[] = [
            StarterKit.configure({
                // 移除了不支持的配置项
            }),
        ]

        // 添加占位符
        if (this.config.placeholder) {
            extensions.push(
                Placeholder.configure({
                    placeholder: this.config.placeholder,
                })
            )
        }

        // 添加表格支持
        if (this.config.enableTables) {
            extensions.push(
                Table.configure({
                    resizable: true,
                }),
                TableRow,
                TableHeader,
                TableCell,
            )
        }

        // 添加图片支持
        if (this.config.enableImages) {
            extensions.push(
                Image.configure({
                    inline: true,
                    allowBase64: true,
                })
            )
        }

        // 添加链接支持
        extensions.push(
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 hover:text-blue-800 underline',
                },
            })
        )

        // 添加任务列表支持
        if (this.config.enableTaskLists) {
            extensions.push(
                TaskList,
                TaskItem.configure({
                    nested: true,
                }),
            )
        }

        // 添加字符统计
        if (this.config.characterLimit) {
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
        // 简化实现：直接返回基本结构
        // 实际实现需要递归处理 AST 节点
        return {
            type: 'doc',
            content: this.astNodeToTipTapContent(ast.root)
        }
    }

    /**
     * 将 AST 节点转换为 TipTap 内容
     */
    private astNodeToTipTapContent(node: ASTNode): any[] {
        // 简化实现：处理基本的富文本节点
        if (node.type === 'paragraph') {
            return [{
                type: 'paragraph',
                content: node.children?.map(child => this.astNodeToTipTap(child)) || []
            }]
        }

        if (node.type === 'heading') {
            const richTextNode = node as RichTextNode
            return [{
                type: 'heading',
                attrs: {
                    level: richTextNode.attributes?.level || 1
                },
                content: node.children?.map(child => this.astNodeToTipTap(child)) || []
            }]
        }

        if (node.type === 'text') {
            const richTextNode = node as RichTextNode
            return [{
                type: 'text',
                text: richTextNode.content || '',
                marks: richTextNode.marks || []
            }]
        }

        // 默认处理
        return [{
            type: 'paragraph',
            content: [{
                type: 'text',
                text: (node as RichTextNode).content || ''
            }]
        }]
    }

    /**
     * 将 AST 节点转换为 TipTap 节点
     */
    private astNodeToTipTap(node: ASTNode): any {
        const richTextNode = node as RichTextNode
        return {
            type: richTextNode.type,
            attrs: richTextNode.attributes || {},
            content: richTextNode.content || '',
            marks: richTextNode.marks || []
        }
    }

    /**
     * 将 TipTap 内容转换为 AST
     */
    private tipTapContentToAST(content: any): DocumentAST {
        // 简化实现：创建基本的文档 AST
        return {
            version: '1.0.0',
            type: 'document',
            id: `doc_${Date.now()}`,
            root: {
                id: 'root',
                type: 'paragraph',
                position: { x: 0, y: 0 },
                content: content.content?.[0]?.content?.[0]?.text || '',
                metadata: {
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                children: []
            },
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                sceneTemplate: this.sceneTemplate
            }
        }
    }

    /**
     * 查找节点位置
     */
    private findNodePosition(_nodeId: string): number | null {
        // 简化实现：返回当前选择位置
        if (this.editor) {
            return this.editor.state.selection.from
        }
        return null
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
}
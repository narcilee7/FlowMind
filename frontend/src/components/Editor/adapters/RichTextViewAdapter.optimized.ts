/**
 * 优化后的富文本视图适配器
 * 
 * 基于新的 CoreViewAdapter 架构，集成错误处理、性能监控和 AI 功能
 * 
 * 改进点：
 * 1. 使用组合模式而非继承，职责更加清晰
 * 2. 完善的错误处理和自动恢复机制
 * 3. 精细化的性能监控
 * 4. 集成 AI Native Editor 功能
 * 5. 更好的内存管理和资源清理
 */

import { CoreViewAdapter, AdapterCapabilities } from './BaseViewAdapter.optimized'
import { ErrorHandlingMixin } from '../mixins/ErrorHandlingMixin'
import { PerformanceMonitoringMixin } from '../mixins/PerformanceMonitoringMixin'
import { AIMixin } from '../mixins/AIMixin'
import { ViewAdapterOptions, Viewport, TextFormat } from '@/components/Editor/types/ViewAdapter'
import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'
import { DocumentAST, ASTNode, Selection, RichTextNode } from '@/components/Editor/types/EditorAST'
import { validateAST } from '@/components/Editor/utils/ASTUtils'

/**
 * TipTap编辑器接口定义
 */
export interface TipTapEditor {
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
        doc: {
            content: any[]
        }
    }
    isFocused: boolean
    getHTML: () => string
    getJSON: () => any
    destroy: () => void
    on: (event: string, callback: Function) => void
    off: (event: string, callback: Function) => void
}

/**
 * 节点位置映射信息
 */
export interface NodePositionMapping {
    nodeId: string
    start: number
    end: number
    path: number[]
    element?: HTMLElement
}

/**
 * 优化后的富文本适配器类
 */
export class OptimizedRichTextViewAdapter extends CoreViewAdapter {
    public readonly type: EditorType.RICH_TEXT = EditorType.RICH_TEXT
    public readonly capabilities: AdapterCapabilities = {
        canEdit: true,
        canSelect: true,
        canZoom: true,
        canDrag: true,
        supportsUndo: true,
        supportsSearch: true,
        supportsAI: true
    }

    // === 功能混入 ===
    private errorHandler: ErrorHandlingMixin
    private perfMonitor: PerformanceMonitoringMixin
    private aiManager: AIMixin

    // === 核心编辑器 ===
    private editor: TipTapEditor | null = null
    private nodePositionMap: Map<string, NodePositionMapping> = new Map()
    // private currentAST: DocumentAST | null = null

    // === 缓存和状态 ===
    private isContentSyncing = false
    private debouncedUpdate: Function | null = null

    // === 配置常量 ===
    private readonly UPDATE_DEBOUNCE_MS = 100
    private readonly MAX_CACHE_SIZE = 1000
    private readonly CLEANUP_INTERVAL_MS = 30000

    // === 清理定时器 ===
    private cleanupTimer: NodeJS.Timeout | null = null

    constructor(sceneTemplate: SceneTemplate) {
        super(sceneTemplate)

        // 初始化功能混入
        this.errorHandler = new ErrorHandlingMixin()
        this.perfMonitor = new PerformanceMonitoringMixin()
        this.aiManager = new AIMixin()

        this.initializeMixins()
    }

    /**
     * 初始化混入模块
     */
    private initializeMixins(): void {
        // 配置错误处理
        this.errorHandler.configureErrorHandling({
            maxHistorySize: 100,
            maxRetryAttempts: 3,
            enableAutoRecovery: true,
            recoveryDelay: 1000,
            errorThreshold: 5
        })

        // 配置性能监控
        this.perfMonitor.configurePerformanceMonitoring({
            enableProfiling: true,
            maxMetricsHistory: 500,
            slowOperationThreshold: 100,
            memoryWarningThreshold: 50 * 1024 * 1024,
            samplingInterval: 2000,
            enableMemoryTracking: true,
            enableRenderTracking: true
        })

        // 配置AI功能
        this.aiManager.configureAI({
            timeout: 30000,
            maxRetries: 3,
            temperature: 0.7,
            maxTokens: 2048
        })

        // 设置错误处理器
        this.errorHandler.setErrorHandler((error: Error) => {
            this.emit('error', error)
        })

        // 监听AI事件
        this.aiManager.onAIEvent('aiCompletion', (data: any) => {
            console.log('[RichText] AI completion:', data.completion)
        })
    }

    /**
     * 创建适配器实现
     */
    protected async performCreate(element: HTMLElement, _options: ViewAdapterOptions): Promise<void> {
        const operationId = this.perfMonitor.startOperation('createAdapter')

        try {
            // 验证输入
            if (!element) {
                throw new Error('Element is required for adapter creation')
            }

            // 启动性能监控
            this.perfMonitor.startMonitoring()

            // 动态加载TipTap模块
            const tipTapModules = await this.loadTipTapModules()

            // 创建编辑器实例
            this.editor = this.createTipTapEditor(element, tipTapModules)

            // 设置事件监听
            this.setupEventListeners()

            // 初始化位置映射
            this.initializePositionMapping()

            // 启动清理定时器
            this.startCleanupTimer()

            // 创建防抖更新函数
            this.debouncedUpdate = this.debounce(
                this.handleContentUpdate.bind(this),
                this.UPDATE_DEBOUNCE_MS
            )

            this.perfMonitor.endOperation(operationId, true)

        } catch (error) {
            this.perfMonitor.endOperation(operationId, false, (error as Error).message)
            this.errorHandler.handleError(error as Error, 'performCreate')
            throw error
        }
    }

    /**
     * 销毁适配器实现
     */
    protected performDestroy(): void {
        try {
            // 停止监控
            this.perfMonitor.stopMonitoring()

            // 清理定时器
            this.stopCleanupTimer()

            // 销毁编辑器
            if (this.editor) {
                this.removeEventListeners()
                this.editor.destroy()
                this.editor = null
            }

            // 清理缓存
            this.nodePositionMap.clear()
            // this.currentAST = null
            this.debouncedUpdate = null

            // 清理混入模块
            this.errorHandler.clearErrorHistory()
            this.perfMonitor.clearMetrics()
            this.aiManager.clearAISuggestions()

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'performDestroy')
        }
    }

    /**
     * 渲染AST实现
     */
    protected performRender(ast: DocumentAST): void {
        const operationId = this.perfMonitor.startOperation('renderAST')

        try {
            // 验证AST
            const validation = validateAST(ast)
            if (!validation.success) {
                throw new Error(`Invalid AST: ${validation.error}`)
            }

            // 记录渲染性能
            const nodeCount = this.countNodes(ast)
            const startTime = performance.now()

            this.isContentSyncing = true

            // 转换AST为HTML内容
            const content = this.astToHtml(ast)

            // 设置编辑器内容
            if (this.editor) {
                this.editor.commands.setContent(content, false)
                this.updatePositionMapping()
            }

            const duration = performance.now() - startTime

            // 记录渲染指标
            this.perfMonitor.recordRenderMetrics('full', nodeCount, duration)
            this.perfMonitor.endOperation(operationId, true)

        } catch (error) {
            this.perfMonitor.endOperation(operationId, false, (error as Error).message)
            this.errorHandler.handleError(error as Error, 'performRender')
            throw error
        } finally {
            this.isContentSyncing = false
        }
    }

    /**
     * 更新节点实现
     */
    protected performUpdateNode(nodeId: string, node: ASTNode): void {
        const operationId = this.perfMonitor.startOperation('updateNode')

        try {
            const mapping = this.nodePositionMap.get(nodeId)
            if (!mapping) {
                throw new Error(`Node ${nodeId} not found in position mapping`)
            }

            const content = this.nodeToHtml(node)
            if (this.editor && content) {
                this.editor.commands.setTextSelection({ from: mapping.start, to: mapping.end })
                this.editor.commands.insertContent(content)
                this.updatePositionMapping()
            }

            this.perfMonitor.endOperation(operationId, true)

        } catch (error) {
            this.perfMonitor.endOperation(operationId, false, (error as Error).message)
            this.errorHandler.handleError(error as Error, 'performUpdateNode')
            throw error
        }
    }

    /**
     * 删除节点实现
     */
    protected performRemoveNode(nodeId: string): void {
        const operationId = this.perfMonitor.startOperation('removeNode')

        try {
            const mapping = this.nodePositionMap.get(nodeId)
            if (!mapping) {
                throw new Error(`Node ${nodeId} not found in position mapping`)
            }

            if (this.editor) {
                this.editor.commands.setTextSelection({ from: mapping.start, to: mapping.end })
                this.editor.commands.deleteSelection()
                this.updatePositionMapping()
            }

            this.perfMonitor.endOperation(operationId, true)

        } catch (error) {
            this.perfMonitor.endOperation(operationId, false, (error as Error).message)
            this.errorHandler.handleError(error as Error, 'performRemoveNode')
            throw error
        }
    }

    /**
     * 添加节点实现
     */
    protected performAddNode(node: ASTNode, parentId?: string, _index?: number): void {
        const operationId = this.perfMonitor.startOperation('addNode')

        try {
            const content = this.nodeToHtml(node)
            if (!content || !this.editor) return

            if (parentId) {
                const parentMapping = this.nodePositionMap.get(parentId)
                if (parentMapping) {
                    this.editor.commands.setTextSelection(parentMapping.end)
                    this.editor.commands.insertContent(content)
                }
            } else {
                // 添加到文档末尾
                const docLength = this.editor.getHTML().length
                this.editor.commands.setTextSelection(docLength)
                this.editor.commands.insertContent(content)
            }

            this.updatePositionMapping()
            this.perfMonitor.endOperation(operationId, true)

        } catch (error) {
            this.perfMonitor.endOperation(operationId, false, (error as Error).message)
            this.errorHandler.handleError(error as Error, 'performAddNode')
            throw error
        }
    }

    /**
     * 设置选择状态实现
     */
    protected performSetSelection(selection: Selection): void {
        try {
            if (!this.editor) return

            if (selection.type === 'text' && selection.range) {
                const { start, end } = selection.range
                this.editor.commands.setTextSelection({ from: start, to: end })
            } else if (selection.type === 'node' && selection.nodeIds.length > 0) {
                const nodeId = selection.nodeIds[0]
                const mapping = this.nodePositionMap.get(nodeId)
                if (mapping) {
                    this.editor.commands.setTextSelection({ from: mapping.start, to: mapping.end })
                }
            }

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'performSetSelection')
        }
    }

    /**
     * 获取选择状态实现
     */
    protected performGetSelection(): Selection {
        try {
            if (!this.editor) {
                return { nodeIds: [], type: 'node' }
            }

            const { from, to } = this.editor.state.selection
            if (from === to) {
                // 光标位置
                const nodeId = this.findNodeIdAtPosition(from)
                return {
                    nodeIds: nodeId ? [nodeId] : [],
                    type: 'node'
                }
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

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'performGetSelection')
            return { nodeIds: [], type: 'node' }
        }
    }

    /**
     * 设置焦点实现
     */
    protected performFocus(): void {
        try {
            if (this.editor) {
                this.editor.commands.focus()
            }
        } catch (error) {
            this.errorHandler.handleError(error as Error, 'performFocus')
        }
    }

    /**
     * 失去焦点实现
     */
    protected performBlur(): void {
        try {
            if (this.editor) {
                this.editor.commands.blur()
            }
        } catch (error) {
            this.errorHandler.handleError(error as Error, 'performBlur')
        }
    }

    /**
     * 获取视口实现
     */
    protected performGetViewport(): Viewport {
        try {
            if (!this.element) {
                return { x: 0, y: 0, width: 0, height: 0, zoom: 1 }
            }

            return {
                x: 0,
                y: 0,
                width: this.element.clientWidth,
                height: this.element.clientHeight,
                zoom: parseFloat(this.element.style.zoom || '1')
            }

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'performGetViewport')
            return { x: 0, y: 0, width: 0, height: 0, zoom: 1 }
        }
    }

    /**
     * 设置视口实现
     */
    protected performSetViewport(viewport: Viewport): void {
        try {
            if (!this.element) return

            if (viewport.zoom) {
                this.element.style.zoom = `${viewport.zoom}`
            }

            this.emit('viewChange', { type: 'viewport', viewport })

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'performSetViewport')
        }
    }

    // === AI 功能扩展 ===

    /**
     * AI智能补全
     */
    public async requestAICompletion(context: string, position: number): Promise<string> {
        try {
            const completion = await this.aiManager.requestAICompletion(context, position)

            // 应用补全到编辑器
            if (this.editor) {
                this.editor.commands.setTextSelection(position)
                this.editor.commands.insertContent(completion)
            }

            return completion

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'requestAICompletion')
            throw error
        }
    }

    /**
     * AI内容重写
     */
    public async requestAIRewrite(content: string, style: string): Promise<string> {
        try {
            return await this.aiManager.requestAIRewrite(content, style)

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'requestAIRewrite')
            throw error
        }
    }

    /**
     * 获取AI建议
     */
    public async getAISuggestions(context?: string): Promise<string[]> {
        try {
            const currentContext = context || this.getCurrentContext()
            const suggestions = await this.aiManager.getAISuggestions(currentContext)
            return suggestions.map(s => s.text)

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'getAISuggestions')
            return []
        }
    }

    // === 富文本特有功能 ===

    /**
     * 格式化文本
     */
    public formatText(start: number, end: number, format: TextFormat): void {
        try {
            if (!this.editor) return

            this.editor.commands.setTextSelection({ from: start, to: end })

            // 应用格式
            if (format.bold) this.editor.commands.toggleBold()
            if (format.italic) this.editor.commands.toggleItalic()
            if (format.underline) this.editor.commands.toggleUnderline()
            if (format.strikethrough) this.editor.commands.toggleStrike()
            if (format.color) this.editor.commands.setColor(format.color)
            if (format.alignment) {
                this.editor.commands.setTextAlign(format.alignment)
            }

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'formatText')
        }
    }

    /**
     * 插入文本
     */
    public insertText(text: string, position?: number): void {
        try {
            if (!this.editor) return

            if (position !== undefined) {
                this.editor.commands.setTextSelection(position)
            }
            this.editor.commands.insertContent(text)

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'insertText')
        }
    }

    // === 公共API - 混入功能访问 ===

    /**
     * 获取错误统计
     */
    public getErrorStats() {
        return this.errorHandler.getErrorStats()
    }

    /**
     * 获取性能统计
     */
    public getPerformanceStats() {
        return this.perfMonitor.getPerformanceStats()
    }

    /**
     * 获取性能报告
     */
    public getPerformanceReport() {
        return this.perfMonitor.getPerformanceReport()
    }

    /**
     * 清除性能指标
     */
    public clearMetrics(): void {
        this.perfMonitor.clearMetrics()
    }

    /**
     * 健康检查
     */
    public healthCheck() {
        return this.perfMonitor.checkPerformanceHealth()
    }

    // === 私有辅助方法 ===

    /**
     * 加载TipTap模块
     */
    private async loadTipTapModules() {
        try {
            // 动态导入以优化打包大小
            const [
                { Editor },
                { StarterKit },
                { Underline },
                { TextAlign },
                { Color },
                { TextStyle },
                { Link },
                { Image }
            ] = await Promise.all([
                import('@tiptap/react'),
                import('@tiptap/starter-kit'),
                import('@tiptap/extension-underline'),
                import('@tiptap/extension-text-align'),
                import('@tiptap/extension-color'),
                import('@tiptap/extension-text-style'),
                import('@tiptap/extension-link'),
                import('@tiptap/extension-image')
            ])

            return { Editor, StarterKit, Underline, TextAlign, Color, TextStyle, Link, Image }

        } catch (error) {
            throw new Error(`Failed to load TipTap modules: ${error}`)
        }
    }

    /**
     * 创建TipTap编辑器
     */
    private createTipTapEditor(element: HTMLElement, modules: any): TipTapEditor {
        return new modules.Editor({
            element,
            extensions: [
                modules.StarterKit,
                modules.Underline,
                modules.TextAlign.configure({
                    types: ['heading', 'paragraph'],
                }),
                modules.Color,
                modules.TextStyle,
                modules.Link.configure({
                    openOnClick: false,
                }),
                modules.Image
            ],
            content: '',
            editorProps: {
                attributes: {
                    class: 'rich-text-editor optimized',
                    spellcheck: 'false',
                    'data-adapter-type': 'rich-text'
                },
            },
            onUpdate: ({ editor }: any) => {
                if (this.debouncedUpdate) {
                    this.debouncedUpdate(editor)
                }
            },
            onSelectionUpdate: () => {
                this.handleSelectionUpdate()
            },
            onFocus: () => {
                this.emit('focus')
            },
            onBlur: () => {
                this.emit('blur')
            },
        }) as TipTapEditor
    }

    /**
     * 设置事件监听
     */
    private setupEventListeners(): void {
        if (!this.element || !this.editor) return

        // 节点交互事件
        this.element.addEventListener('click', this.handleNodeClick.bind(this))
        this.element.addEventListener('dblclick', this.handleNodeDoubleClick.bind(this))

        // 键盘快捷键
        this.element.addEventListener('keydown', this.handleKeyDown.bind(this))
    }

    /**
     * 移除事件监听
     */
    private removeEventListeners(): void {
        if (!this.element) return

        this.element.removeEventListener('click', this.handleNodeClick)
        this.element.removeEventListener('dblclick', this.handleNodeDoubleClick)
        this.element.removeEventListener('keydown', this.handleKeyDown)
    }

    /**
     * 处理内容更新
     */
    private handleContentUpdate(editor: TipTapEditor): void {
        if (this.isContentSyncing) return

        try {
            const content = editor.getHTML()
            this.updatePositionMapping()
            this.emit('viewChange', { type: 'contentUpdate', content })

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'handleContentUpdate')
        }
    }

    /**
     * 处理选择更新
     */
    private handleSelectionUpdate(): void {
        if (this.isContentSyncing) return

        try {
            const selection = this.performGetSelection()
            this.emit('selectionChange', selection)

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'handleSelectionUpdate')
        }
    }

    /**
     * 处理节点点击
     */
    private handleNodeClick = (event: MouseEvent): void => {
        try {
            const target = event.target as HTMLElement
            const nodeId = target.closest('[data-node-id]')?.getAttribute('data-node-id')

            if (nodeId) {
                this.emit('nodeClick', { nodeId, event })
            }

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'handleNodeClick')
        }
    }

    /**
     * 处理节点双击
     */
    private handleNodeDoubleClick = (event: MouseEvent): void => {
        try {
            const target = event.target as HTMLElement
            const nodeId = target.closest('[data-node-id]')?.getAttribute('data-node-id')

            if (nodeId) {
                this.emit('nodeDoubleClick', { nodeId, event })
            }

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'handleNodeDoubleClick')
        }
    }

    /**
     * 处理键盘事件
     */
    private handleKeyDown = (event: KeyboardEvent): void => {
        try {
            // 处理快捷键
            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case 'b':
                        event.preventDefault()
                        this.editor?.commands.toggleBold()
                        break
                    case 'i':
                        event.preventDefault()
                        this.editor?.commands.toggleItalic()
                        break
                    case 'u':
                        event.preventDefault()
                        this.editor?.commands.toggleUnderline()
                        break
                }
            }

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'handleKeyDown')
        }
    }

    /**
     * 获取当前上下文
     */
    private getCurrentContext(): string {
        try {
            if (!this.editor) return ''

            const { from } = this.editor.state.selection
            const html = this.editor.getHTML()

            // 获取光标前的内容作为上下文
            const beforeCursor = html.substring(0, from)
            return beforeCursor.slice(-200) // 取最后200个字符作为上下文

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'getCurrentContext')
            return ''
        }
    }

    // === 位置映射和内容转换方法 ===

    private initializePositionMapping(): void {
        this.nodePositionMap.clear()
        this.updatePositionMapping()
    }

    private updatePositionMapping(): void {
        // 实现位置映射更新逻辑
        // 这里简化实现，实际项目中需要更复杂的DOM遍历
        this.nodePositionMap.clear()
    }

    private findNodeIdAtPosition(position: number): string | null {
        for (const [nodeId, mapping] of this.nodePositionMap) {
            if (position >= mapping.start && position <= mapping.end) {
                return nodeId
            }
        }
        return null
    }

    private astToHtml(ast: DocumentAST): string {
        return this.nodeToHtml(ast.root)
    }

    private nodeToHtml(node: ASTNode): string {
        if (!node) return ''

        // 简化实现，实际项目中需要完整的AST到HTML转换
        switch (node.type) {
            case 'paragraph':
                return `<p data-node-id="${node.id}">${this.getNodeContent(node)}</p>`
            case 'heading':
                const level = (node as RichTextNode).attributes?.level || 1
                return `<h${level} data-node-id="${node.id}">${this.getNodeContent(node)}</h${level}>`
            default:
                return `<div data-node-id="${node.id}">${this.getNodeContent(node)}</div>`
        }
    }

    private getNodeContent(node: ASTNode): string {
        if ((node as RichTextNode).content) {
            return (node as RichTextNode).content || ''
        }

        if (node.children && node.children.length > 0) {
            return node.children.map(child => this.nodeToHtml(child)).join('')
        }

        return ''
    }

    private countNodes(ast: DocumentAST): number {
        let count = 0
        const traverse = (node: ASTNode) => {
            count++
            if (node.children) {
                node.children.forEach(traverse)
            }
        }
        traverse(ast.root)
        return count
    }

    // === 工具方法 ===

    private debounce(func: Function, wait: number): Function {
        let timeout: NodeJS.Timeout
        return (...args: any[]) => {
            clearTimeout(timeout)
            timeout = setTimeout(() => func.apply(this, args), wait)
        }
    }

    private startCleanupTimer(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer)
        }

        this.cleanupTimer = setInterval(() => {
            this.performPeriodicCleanup()
        }, this.CLEANUP_INTERVAL_MS)
    }

    private stopCleanupTimer(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer)
            this.cleanupTimer = null
        }
    }

    private performPeriodicCleanup(): void {
        try {
            // 清理过期的位置映射
            if (this.nodePositionMap.size > this.MAX_CACHE_SIZE) {
                this.nodePositionMap.clear()
                this.updatePositionMapping()
            }

            // 检查性能健康状况
            const health = this.perfMonitor.checkPerformanceHealth()
            if (!health.isHealthy) {
                console.warn('[RichText] Performance issues detected:', health.issues)
            }

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'performPeriodicCleanup')
        }
    }
}

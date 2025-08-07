/**
 * 富文本视图适配器
 * 基于TipTap/ProseMirror实现，提供完整的富文本编辑功能
 * 
 * 架构特点：
 * - 完整的AST与视图同步机制
 * - 防御型编程，全面的错误处理
 * - 性能优化，批量更新和防抖机制
 * - 类型安全，完整的TypeScript支持
 * - AI Native Editor支持，集成AI功能
 */

import { ViewAdapterOptions, RichTextViewAdapter as IRichTextViewAdapter, TextFormat } from '@/components/Editor/types/ViewAdapter'
import { EditorType } from '@/components/Editor/types/EditorType'
import { DocumentAST, ASTNode, Selection, RichTextNode } from '@/components/Editor/types/EditorAST'
import { BaseViewAdapter, EventCallback } from './BaseViewAdapter'
import { createDocumentAST, createRichTextNode, validateAST } from '@/components/Editor/utils/ASTUtils'
import { debounce, throttle } from '@/components/Editor/utils/CommonUtils'

/**
 * TipTap编辑器类型定义
 * 包含所有必要的编辑器方法和属性
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
 * 用于维护AST节点与编辑器位置的双向映射
 */
export interface NodePositionMapping {
    nodeId: string
    start: number
    end: number
    path: number[]
    element?: HTMLElement
}

/**
 * AI建议类型
 */
export interface AISuggestion {
    id: string
    text: string
    type: 'completion' | 'rewrite' | 'research' | 'knowledge'
    confidence: number
    context?: string
}

/**
 * 富文本视图适配器实现
 * 提供完整的富文本编辑功能，包括内容同步、格式化和事件处理
 */
export class RichTextViewAdapter extends BaseViewAdapter implements IRichTextViewAdapter {
    public readonly type: EditorType.RICH_TEXT = EditorType.RICH_TEXT
    
    // 核心编辑器实例
    private editor: TipTapEditor | null = null
    
    // 节点位置映射表，用于快速定位节点
    private nodePositionMap: Map<string, NodePositionMapping> = new Map()
    
    // 内容更新队列，用于批量处理更新
    private contentUpdateQueue: (() => void)[] = []
    
    // 更新状态标志
    private isUpdating = false
    private isContentSyncing = false
    private isDestroying = false
    
    // 当前AST缓存
    private currentAST: DocumentAST | null = null
    
    // AI相关状态
    private aiSuggestions: AISuggestion[] = []
    private isAIProcessing = false
    
    // 自定义AI事件回调
    private aiEventCallbacks: Map<string, Function[]> = new Map()
    
    // 最大错误次数
    private readonly MAX_ERRORS = 5
    
    // 性能优化配置
    // 更新防抖时间
    private readonly UPDATE_DEBOUNCE_MS = 100
    // 选择节流时间
    private readonly SELECTION_THROTTLE_MS = 50
    // 批量更新延迟时间
    private readonly BATCH_UPDATE_DELAY_MS = 16
    // 错误恢复延迟时间
    private readonly ERROR_RECOVERY_DELAY_MS = 1000
    // AI处理超时时间
    private readonly AI_TIMEOUT_MS = 30000
    
    // 内存管理
    // 最大缓存大小
    private readonly MAX_CACHE_SIZE = 1000
    // 清理间隔时间
    private readonly CLEANUP_INTERVAL_MS = 30000
    // 清理定时器
    private cleanupTimer: NodeJS.Timeout | null = null

    /**
     * 创建适配器
     * @param element 目标DOM元素
     * @param options 适配器选项
     */
    async create(element: HTMLElement, options: ViewAdapterOptions): Promise<void> {
        // 防御性检查
        if (!element) {
            throw new Error('Element is required for adapter creation')
        }
        
        if (this.isInitialized) {
            this.handleError(new Error('Adapter already initialized'), 'create')
            return
        }

        if (this.isDestroying) {
            throw new Error('Adapter is being destroyed, cannot create')
        }

        this.element = element
        this.options = options

        try {
            // 重置错误计数
            this.errorCount = 0
            this.lastErrorTime = 0
            
            // 动态导入TipTap相关模块
            const tipTapModules = await this.loadTipTapModules()
            
            // 创建TipTap编辑器
            this.editor = this.createTipTapEditor(tipTapModules)
            
            // 设置主题样式
            this.applyTheme(options.theme || 'auto')
            
            // 初始化事件监听
            this.setupEventListeners()
            
            // 初始化位置映射
            this.initializePositionMapping()
            
            // 启动清理定时器
            this.startCleanupTimer()
            
            this.isInitialized = true
            this.triggerEvent('viewChange', { type: 'initialized' })

        } catch (error) {
            this.handleError(error as Error, 'create')
            throw error
        }
    }

    /**
     * 加载TipTap模块
     * 动态导入所有必要的TipTap扩展
     */
    private async loadTipTapModules() {
        try {
            const [
                { Editor },
                { StarterKit },
                { Underline },
                { TextAlign },
                { Color },
                { TextStyle },
                { Link },
                { Image },
                { Table },
                { TableRow },
                { TableCell },
                { TableHeader }
            ] = await Promise.all([
                import('@tiptap/react'),
                import('@tiptap/starter-kit'),
                import('@tiptap/extension-underline'),
                import('@tiptap/extension-text-align'),
                import('@tiptap/extension-color'),
                import('@tiptap/extension-text-style'),
                import('@tiptap/extension-link'),
                import('@tiptap/extension-image'),
                import('@tiptap/extension-table'),
                import('@tiptap/extension-table-row'),
                import('@tiptap/extension-table-cell'),
                import('@tiptap/extension-table-header')
            ])

            return {
                Editor,
                StarterKit,
                Underline,
                TextAlign,
                Color,
                TextStyle,
                Link,
                Image,
                Table,
                TableRow,
                TableCell,
                TableHeader
            }
        } catch (error) {
            throw new Error(`Failed to load TipTap modules: ${error}`)
        }
    }

    /**
     * 创建TipTap编辑器实例
     * @param modules TipTap模块
     */
    private createTipTapEditor(modules: any): TipTapEditor {
        if (!this.element) {
            throw new Error('Element not available for editor creation')
        }

        return new modules.Editor({
            element: this.element,
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
                modules.Image,
                modules.Table.configure({
                    resizable: true,
                }),
                modules.TableRow,
                modules.TableCell,
                modules.TableHeader,
            ],
            content: '',
            editorProps: {
                attributes: {
                    class: 'rich-text-editor',
                    spellcheck: 'false',
                    'data-adapter-type': 'rich-text'
                },
            },
            onUpdate: ({ editor }: any) => {
                this.handleContentUpdate(editor)
            },
            onSelectionUpdate: () => {
                this.handleSelectionUpdate()
            },
            onFocus: () => {
                this.triggerEvent('focus')
            },
            onBlur: () => {
                this.triggerEvent('blur')
            },
        }) as TipTapEditor
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        if (!this.element || !this.editor) return

        // 节点点击事件
        this.element.addEventListener('click', this.handleNodeClick.bind(this))
        this.element.addEventListener('dblclick', this.handleNodeDoubleClick.bind(this))
        
        // 键盘事件
        this.element.addEventListener('keydown', this.handleKeyDown.bind(this))
        
        // 拖拽事件
        this.element.addEventListener('dragstart', this.handleDragStart.bind(this))
        this.element.addEventListener('drop', this.handleDrop.bind(this))
    }

    /**
     * 初始化位置映射
     */
    private initializePositionMapping(): void {
        this.nodePositionMap.clear()
        this.updatePositionMapping()
    }

    /**
     * 更新位置映射
     * 遍历DOM树，建立节点ID与位置的映射关系
     */
    private updatePositionMapping(): void {
        if (!this.element) return

        this.nodePositionMap.clear()
        const walker = document.createTreeWalker(
            this.element,
            NodeFilter.SHOW_ELEMENT,
            {
                acceptNode: (node) => {
                    const element = node as HTMLElement
                    return element.hasAttribute('data-node-id') 
                        ? NodeFilter.FILTER_ACCEPT 
                        : NodeFilter.FILTER_SKIP
                }
            }
        )

        let node: Node | null
        while (node = walker.nextNode()) {
            const element = node as HTMLElement
            const nodeId = element.getAttribute('data-node-id')
            if (nodeId) {
                const range = document.createRange()
                range.selectNodeContents(element)
                
                this.nodePositionMap.set(nodeId, {
                    nodeId,
                    start: this.getNodeOffset(element),
                    end: this.getNodeOffset(element) + (element.textContent?.length || 0),
                    path: this.calculateNodePath(element),
                    element
                })
            }
        }
    }

    /**
     * 获取节点在文档中的偏移量
     */
    private getNodeOffset(element: HTMLElement): number {
        let offset = 0
        const walker = document.createTreeWalker(
            this.element!,
            NodeFilter.SHOW_TEXT
        )

        let node: Node | null
        while (node = walker.nextNode()) {
            if (element.contains(node)) {
                break
            }
            offset += node.textContent?.length || 0
        }

        return offset
    }

    /**
     * 计算节点路径
     */
    private calculateNodePath(element: HTMLElement): number[] {
        const path: number[] = []
        let current = element

        while (current && current !== this.element) {
            const parent = current.parentElement
            if (parent) {
                const index = Array.from(parent.children).indexOf(current)
                path.unshift(index)
            }
            current = parent!
        }

        return path
    }

    /**
     * 执行销毁逻辑
     */
    protected performDestroy(): void {
        this.isDestroying = true
        
        // 停止清理定时器
        this.stopCleanupTimer()
        
        // 清理AI事件回调
        this.aiEventCallbacks.clear()
        
        if (this.editor) {
            // 移除事件监听器
            this.element?.removeEventListener('click', this.handleNodeClick.bind(this))
            this.element?.removeEventListener('dblclick', this.handleNodeDoubleClick.bind(this))
            this.element?.removeEventListener('keydown', this.handleKeyDown.bind(this))
            this.element?.removeEventListener('dragstart', this.handleDragStart.bind(this))
            this.element?.removeEventListener('drop', this.handleDrop.bind(this))
            
            // 销毁编辑器
            this.editor.destroy()
            this.editor = null
        }
        
        // 清理映射表
        this.nodePositionMap.clear()
        this.currentAST = null
        this.contentUpdateQueue = []
        this.aiSuggestions = []
        
        this.isDestroying = false
    }

    /**
     * 启动清理定时器
     */
    private startCleanupTimer(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer)
        }
        
        this.cleanupTimer = setInterval(() => {
            this.performCleanup()
        }, this.CLEANUP_INTERVAL_MS)
    }

    /**
     * 停止清理定时器
     */
    private stopCleanupTimer(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer)
            this.cleanupTimer = null
        }
    }

    /**
     * 执行清理操作
     */
    private performCleanup(): void {
        try {
            // 清理过期的位置映射
            if (this.nodePositionMap.size > this.MAX_CACHE_SIZE) {
                const entries = Array.from(this.nodePositionMap.entries())
                const toDelete = entries.slice(0, entries.length - this.MAX_CACHE_SIZE)
                toDelete.forEach(([key]) => this.nodePositionMap.delete(key))
            }
            
            // 清理更新队列
            if (this.contentUpdateQueue.length > 100) {
                this.contentUpdateQueue = this.contentUpdateQueue.slice(-50)
            }
            
            // 重置错误计数（如果距离上次错误已经很久）
            const now = Date.now()
            if (now - this.lastErrorTime > this.ERROR_RECOVERY_DELAY_MS * 2) {
                this.errorCount = 0
            }
        } catch (error) {
            this.handleError(error as Error, 'performCleanup')
        }
    }

    /**
     * 渲染AST
     * @param ast 文档AST
     */
    render(ast: DocumentAST): void {
        if (!this.validateInitialized() || !this.editor) return

        // 开始性能监控
        this.startPerformanceMonitoring()

        // 验证AST
        const validation = validateAST(ast)
        if (!validation.success) {
            this.handleError(new Error(`Invalid AST: ${validation.error}`), 'render')
            this.endPerformanceMonitoring('render')
            return
        }

        this.currentAST = ast
        this.isContentSyncing = true

        try {
            const content = this.safeSync(() => this.astToTipTapContent(ast), 'render')
            if (content) {
                this.editor.commands.setContent(content, false)
                this.updatePositionMapping()
            }
        } finally {
            this.isContentSyncing = false
            // 结束性能监控
            this.endPerformanceMonitoring('render')
        }
    }

    /**
     * 更新节点
     * @param nodeId 节点ID
     * @param node 更新后的节点
     */
    updateNode(nodeId: string, node: ASTNode): void {
        if (!this.validateInitialized() || !this.editor) return

        const mapping = this.nodePositionMap.get(nodeId)
        if (!mapping) {
            this.handleError(new Error(`Node ${nodeId} not found in position mapping`), 'updateNode')
            return
        }

        const content = this.safeSync(() => this.nodeToHtml(node), 'updateNode')
        if (content) {
            this.editor.commands.setTextSelection({ from: mapping.start, to: mapping.end })
            this.editor.commands.insertContent(content)
            this.updatePositionMapping()
        }
    }

    /**
     * 删除节点
     * @param nodeId 节点ID
     */
    removeNode(nodeId: string): void {
        if (!this.validateInitialized() || !this.editor) return

        const mapping = this.nodePositionMap.get(nodeId)
        if (!mapping) {
            this.handleError(new Error(`Node ${nodeId} not found in position mapping`), 'removeNode')
            return
        }

        this.editor.commands.setTextSelection({ from: mapping.start, to: mapping.end })
        this.editor.commands.deleteSelection()
        this.updatePositionMapping()
    }

    /**
     * 添加节点
     * @param node 要添加的节点
     * @param parentId 父节点ID
     * @param index 插入位置
     */
    addNode(node: ASTNode, parentId?: string, index?: number): void {
        if (!this.validateInitialized() || !this.editor) return

        const content = this.safeSync(() => this.nodeToHtml(node), 'addNode')
        if (!content) return

        if (parentId) {
            // 添加到指定父节点
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
    }

    /**
     * 设置选择状态
     * @param selection 选择状态
     */
    setSelection(selection: Selection): void {
        if (!this.validateInitialized() || !this.editor) return

        if (selection.type === 'text' && selection.range) {
            const { start, end } = selection.range
            this.editor.commands.setTextSelection({ from: start, to: end })
        } else if (selection.type === 'node' && selection.nodeIds.length > 0) {
            // 对于节点选择，选择第一个节点
            const nodeId = selection.nodeIds[0]
            const mapping = this.nodePositionMap.get(nodeId)
            if (mapping) {
                this.editor.commands.setTextSelection({ from: mapping.start, to: mapping.end })
            }
        }
    }

    /**
     * 获取选择状态
     * @returns 当前选择状态
     */
    getSelection(): Selection {
        if (!this.validateInitialized() || !this.editor) {
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
     * @param nodeId 节点ID
     */
    scrollToNode(nodeId: string): void {
        if (!this.validateInitialized() || !this.element) return

        const mapping = this.nodePositionMap.get(nodeId)
        if (mapping?.element) {
            mapping.element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            })
        }
    }

    /**
     * 放大视图
     */
    zoomIn(): void {
        if (!this.validateInitialized() || !this.element) return

        const currentZoom = parseFloat(this.element.style.zoom || '1')
        const newZoom = Math.min(currentZoom * 1.2, 3)
        this.element.style.zoom = `${newZoom}`
        this.triggerEvent('viewChange', { type: 'zoom', zoom: newZoom })
    }

    /**
     * 缩小视图
     */
    zoomOut(): void {
        if (!this.validateInitialized() || !this.element) return

        const currentZoom = parseFloat(this.element.style.zoom || '1')
        const newZoom = Math.max(currentZoom * 0.8, 0.5)
        this.element.style.zoom = `${newZoom}`
        this.triggerEvent('viewChange', { type: 'zoom', zoom: newZoom })
    }

    /**
     * 重置缩放
     */
    resetZoom(): void {
        if (!this.validateInitialized() || !this.element) return

        this.element.style.zoom = '1'
        this.triggerEvent('viewChange', { type: 'zoom', zoom: 1 })
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
     * @param viewport 视口信息
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
     * @param text 要插入的文本
     * @param position 插入位置
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
     * @param start 开始位置
     * @param end 结束位置
     */
    deleteText(start: number, end: number): void {
        if (!this.validateInitialized() || !this.editor) return

        this.editor.commands.setTextSelection({ from: start, to: end })
        this.editor.commands.deleteSelection()
    }

    /**
     * 格式化文本
     * @param start 开始位置
     * @param end 结束位置
     * @param format 格式信息
     */
    formatText(start: number, end: number, format: TextFormat): void {
        if (!this.validateInitialized() || !this.editor) return

        this.editor.commands.setTextSelection({ from: start, to: end })

        // 应用格式
        if (format.bold) this.editor.commands.toggleBold()
        if (format.italic) this.editor.commands.toggleItalic()
        if (format.underline) this.editor.commands.toggleUnderline()
        if (format.strikethrough) this.editor.commands.toggleStrike()
        if (format.color) this.editor.commands.setColor(format.color)
        if (format.backgroundColor) {
            this.editor.commands.setMark('textStyle', { backgroundColor: format.backgroundColor })
        }
        if (format.fontSize) {
            this.editor.commands.setMark('textStyle', { fontSize: format.fontSize })
        }
        if (format.fontFamily) {
            this.editor.commands.setMark('textStyle', { fontFamily: format.fontFamily })
        }
        if (format.alignment) {
            this.editor.commands.setTextAlign(format.alignment)
        }
    }

    /**
     * 插入节点
     * @param node 要插入的节点
     * @param position 插入位置
     */
    insertNode(node: ASTNode, position?: number): void {
        if (!this.validateInitialized() || !this.editor) return

        const content = this.safeSync(() => this.nodeToHtml(node), 'insertNode')
        if (!content) return

        if (position !== undefined) {
            this.editor.commands.setTextSelection(position)
        }
        this.editor.commands.insertContent(content)
        this.updatePositionMapping()
    }

    /**
     * 文本变化事件
     * @param callback 回调函数
     */
    onTextChange(callback: EventCallback<string>): void {
        this.addEventListener('textChange', callback)
    }

    /**
     * 格式变化事件
     * @param callback 回调函数
     */
    onFormatChange(callback: EventCallback<TextFormat>): void {
        this.addEventListener('formatChange', callback)
    }

    // AI Native Editor 方法实现

    /**
     * 请求AI补全
     * @param context 上下文内容
     * @param position 当前位置
     */
    async requestAICompletion(context: string, position: number): Promise<string> {
        if (!this.validateInitialized() || !this.editor) {
            throw new Error('Editor not initialized')
        }

        if (this.isAIProcessing) {
            throw new Error('AI is already processing')
        }

        this.isAIProcessing = true
        const timeoutId = setTimeout(() => {
            this.isAIProcessing = false
            throw new Error('AI completion timeout')
        }, this.AI_TIMEOUT_MS)

        try {
            // 获取当前上下文
            const currentContext = this.getCurrentContext()
            const fullContext = `${currentContext}\n${context}`

            // 模拟AI补全（实际项目中这里会调用真实的AI API）
            const completion = await this.simulateAICompletion(fullContext, position)
            
            // 插入补全内容
            this.editor.commands.setTextSelection(position)
            this.editor.commands.insertContent(completion)
            
            this.triggerAIEvent('aiCompletion', { context, position, completion })
            return completion

        } catch (error) {
            this.handleError(error as Error, 'requestAICompletion')
            throw error
        } finally {
            clearTimeout(timeoutId)
            this.isAIProcessing = false
        }
    }

    /**
     * 请求AI重写
     * @param content 要重写的内容
     * @param style 重写风格
     */
    async requestAIRewrite(content: string, style: string): Promise<string> {
        if (!this.validateInitialized()) {
            throw new Error('Editor not initialized')
        }

        if (this.isAIProcessing) {
            throw new Error('AI is already processing')
        }

        this.isAIProcessing = true
        const timeoutId = setTimeout(() => {
            this.isAIProcessing = false
            throw new Error('AI rewrite timeout')
        }, this.AI_TIMEOUT_MS)

        try {
            // 模拟AI重写
            const rewritten = await this.simulateAIRewrite(content, style)
            
            this.triggerAIEvent('aiRewrite', { content, style, rewritten })
            return rewritten

        } catch (error) {
            this.handleError(error as Error, 'requestAIRewrite')
            throw error
        } finally {
            clearTimeout(timeoutId)
            this.isAIProcessing = false
        }
    }

    /**
     * 请求AI研究
     * @param query 研究查询
     */
    async requestAIResearch(query: string): Promise<any> {
        if (!this.validateInitialized()) {
            throw new Error('Editor not initialized')
        }

        if (this.isAIProcessing) {
            throw new Error('AI is already processing')
        }

        this.isAIProcessing = true
        const timeoutId = setTimeout(() => {
            this.isAIProcessing = false
            throw new Error('AI research timeout')
        }, this.AI_TIMEOUT_MS)

        try {
            // 模拟AI研究
            const research = await this.simulateAIResearch(query)
            
            this.triggerAIEvent('aiResearch', { query, research })
            return research

        } catch (error) {
            this.handleError(error as Error, 'requestAIResearch')
            throw error
        } finally {
            clearTimeout(timeoutId)
            this.isAIProcessing = false
        }
    }

    /**
     * 提取知识
     * @param content 内容
     */
    async extractKnowledge(content: string): Promise<any> {
        if (!this.validateInitialized()) {
            throw new Error('Editor not initialized')
        }

        if (this.isAIProcessing) {
            throw new Error('AI is already processing')
        }

        this.isAIProcessing = true
        const timeoutId = setTimeout(() => {
            this.isAIProcessing = false
            throw new Error('Knowledge extraction timeout')
        }, this.AI_TIMEOUT_MS)

        try {
            // 模拟知识提取
            const knowledge = await this.simulateKnowledgeExtraction(content)
            
            this.triggerAIEvent('knowledgeExtraction', { content, knowledge })
            return knowledge

        } catch (error) {
            this.handleError(error as Error, 'extractKnowledge')
            throw error
        } finally {
            clearTimeout(timeoutId)
            this.isAIProcessing = false
        }
    }

    /**
     * 获取当前上下文
     */
    protected getCurrentContext(): string {
        if (!this.editor) return ''
        
        try {
            const { from } = this.editor.state.selection
            const html = this.editor.getHTML()
            
            // 获取光标前的内容作为上下文
            const beforeCursor = html.substring(0, from)
            return beforeCursor.slice(-200) // 取最后200个字符作为上下文
        } catch (error) {
            this.handleError(error as Error, 'getCurrentContext')
            return ''
        }
    }

    /**
     * 获取AI建议
     * @param context 上下文
     */
    async getAISuggestions(context?: string): Promise<string[]> {
        if (!this.validateInitialized()) {
            return []
        }

        try {
            const currentContext = context || this.getCurrentContext()
            
            // 模拟AI建议
            const suggestions = await this.simulateAISuggestions(currentContext)
            
            this.aiSuggestions = suggestions.map((suggestion, index) => ({
                id: `suggestion_${Date.now()}_${index}`,
                text: suggestion,
                type: 'completion' as const,
                confidence: 0.8,
                context: currentContext
            }))
            
            this.triggerAIEvent('aiSuggestions', { suggestions: this.aiSuggestions })
            return suggestions

        } catch (error) {
            this.handleError(error as Error, 'getAISuggestions')
            return []
        }
    }

    /**
     * 应用AI建议
     * @param suggestion 建议内容
     */
    async applyAISuggestion(suggestion: string): Promise<void> {
        if (!this.validateInitialized() || !this.editor) {
            throw new Error('Editor not initialized')
        }

        try {
            const { from } = this.editor.state.selection
            this.editor.commands.setTextSelection(from)
            this.editor.commands.insertContent(suggestion)
            
            this.triggerAIEvent('aiSuggestionApplied', { suggestion })
        } catch (error) {
            this.handleError(error as Error, 'applyAISuggestion')
            throw error
        }
    }

    /**
     * 触发AI事件
     * @param eventName 事件名称
     * @param data 事件数据
     */
    private triggerAIEvent(eventName: string, data: any): void {
        const callbacks = this.aiEventCallbacks.get(eventName) || []
        callbacks.forEach(callback => {
            try {
                callback(data)
            } catch (error) {
                this.handleError(error as Error, `triggerAIEvent:${eventName}`)
            }
        })
    }

    /**
     * 添加AI事件监听器
     * @param eventName 事件名称
     * @param callback 回调函数
     */
    public onAIEvent(eventName: string, callback: Function): void {
        if (!this.aiEventCallbacks.has(eventName)) {
            this.aiEventCallbacks.set(eventName, [])
        }
        this.aiEventCallbacks.get(eventName)!.push(callback)
    }

    /**
     * 移除AI事件监听器
     * @param eventName 事件名称
     * @param callback 回调函数
     */
    public offAIEvent(eventName: string, callback: Function): void {
        const callbacks = this.aiEventCallbacks.get(eventName) || []
        const index = callbacks.indexOf(callback)
        if (index > -1) {
            callbacks.splice(index, 1)
        }
    }

    /**
     * 模拟AI方法（实际项目中会替换为真实的AI API调用）
     */
    private async simulateAICompletion(context: string, position: number): Promise<string> {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 简单的补全逻辑
        const words = context.split(' ').slice(-3)
        const lastWord = words[words.length - 1] || ''
        
        if (lastWord.toLowerCase().includes('hello')) {
            return ' world!'
        } else if (lastWord.toLowerCase().includes('thank')) {
            return ' you!'
        } else {
            return '...'
        }
    }

    private async simulateAIRewrite(content: string, style: string): Promise<string> {
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        switch (style.toLowerCase()) {
            case 'formal':
                return content.replace(/\b\w+/g, word => word.charAt(0).toUpperCase() + word.slice(1))
            case 'casual':
                return content.toLowerCase()
            case 'professional':
                return `Professional version: ${content}`
            default:
                return content
        }
    }

    private async simulateAIResearch(query: string): Promise<any> {
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        return {
            query,
            results: [
                { title: 'Research Result 1', content: 'This is a simulated research result.' },
                { title: 'Research Result 2', content: 'Another simulated research result.' }
            ],
            summary: `Research summary for: ${query}`
        }
    }

    private async simulateKnowledgeExtraction(content: string): Promise<any> {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        return {
            entities: ['entity1', 'entity2'],
            concepts: ['concept1', 'concept2'],
            relationships: ['rel1', 'rel2'],
            summary: 'Extracted knowledge summary'
        }
    }

    private async simulateAISuggestions(context: string): Promise<string[]> {
        await new Promise(resolve => setTimeout(resolve, 500))
        
        return [
            'Continue writing...',
            'Add more details',
            'Summarize the main points',
            'Provide examples'
        ]
    }

    // 私有方法

    /**
     * 处理内容更新
     * 使用防抖机制避免频繁更新
     */
    private handleContentUpdate = debounce((editor: TipTapEditor): void => {
        if (this.isContentSyncing) return

        const content = editor.getHTML()
        this.triggerEvent('textChange', content)
        this.triggerEvent('viewChange', { type: 'contentUpdate', content })
        
        // 更新位置映射
        this.updatePositionMapping()
    }, this.UPDATE_DEBOUNCE_MS)

    /**
     * 处理选择更新
     * 使用节流机制优化性能
     */
    private handleSelectionUpdate = throttle((): void => {
        if (this.isContentSyncing) return

        const selection = this.getSelection()
        this.triggerEvent('selectionChange', selection)

        // 更新位置映射
        this.updatePositionMapping()
    }, this.SELECTION_THROTTLE_MS)

    /**
     * 处理节点点击
     */
    private handleNodeClick = (event: MouseEvent): void => {
        const target = event.target as HTMLElement
        const nodeId = target.closest('[data-node-id]')?.getAttribute('data-node-id')
        
        if (nodeId) {
            this.triggerEvent('nodeClick', { nodeId, event })
        }
    }

    /**
     * 处理节点双击
     */
    private handleNodeDoubleClick = (event: MouseEvent): void => {
        const target = event.target as HTMLElement
        const nodeId = target.closest('[data-node-id]')?.getAttribute('data-node-id')
        
        if (nodeId) {
            this.triggerEvent('nodeDoubleClick', { nodeId, event })
        }
    }

    /**
     * 处理键盘事件
     */
    private handleKeyDown = (event: KeyboardEvent): void => {
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
    }

    /**
     * 处理拖拽开始
     */
    private handleDragStart = (event: DragEvent): void => {
        const target = event.target as HTMLElement
        const nodeId = target.closest('[data-node-id]')?.getAttribute('data-node-id')
        
        if (nodeId && event.dataTransfer) {
            event.dataTransfer.setData('text/plain', nodeId)
            event.dataTransfer.effectAllowed = 'move'
        }
    }

    /**
     * 处理拖拽放置
     */
    private handleDrop = (event: DragEvent): void => {
        event.preventDefault()
        
        const nodeId = event.dataTransfer?.getData('text/plain')
        if (nodeId) {
            const target = event.target as HTMLElement
            const targetNodeId = target.closest('[data-node-id]')?.getAttribute('data-node-id')
            
            if (targetNodeId && targetNodeId !== nodeId) {
                this.triggerEvent('nodeDrag', { 
                    nodeId, 
                    position: { x: event.clientX, y: event.clientY } 
                })
            }
        }
    }

    /**
     * 将AST转换为TipTap可识别的HTML内容
     * @param ast 文档AST
     */
    private astToTipTapContent(ast: DocumentAST): string {
        return this.nodeToHtml(ast.root)
    }

    /**
     * 将节点转换为HTML内容
     * @param node AST节点
     */
    private nodeToHtml(node: ASTNode): string {
        if (!node) return ''

        switch (node.type) {
            case 'paragraph':
                return `<p data-node-id="${node.id}">${this.getNodeContent(node)}</p>`
            case 'heading':
                const level = (node as RichTextNode).attributes?.level || 1
                return `<h${level} data-node-id="${node.id}">${this.getNodeContent(node)}</h${level}>`
            case 'text':
                return this.getNodeContent(node)
            case 'bold':
                return `<strong>${this.getNodeContent(node)}</strong>`
            case 'italic':
                return `<em>${this.getNodeContent(node)}</em>`
            case 'underline':
                return `<u>${this.getNodeContent(node)}</u>`
            case 'strikethrough':
                return `<s>${this.getNodeContent(node)}</s>`
            case 'code':
                return `<code>${this.getNodeContent(node)}</code>`
            case 'codeBlock':
                const language = (node as RichTextNode).attributes?.language || ''
                return `<pre data-node-id="${node.id}"><code class="language-${language}">${this.getNodeContent(node)}</code></pre>`
            case 'link':
                const href = (node as RichTextNode).attributes?.href || '#'
                return `<a href="${href}" data-node-id="${node.id}">${this.getNodeContent(node)}</a>`
            case 'image':
                const src = (node as RichTextNode).attributes?.src || ''
                const alt = (node as RichTextNode).attributes?.alt || ''
                return `<img src="${src}" alt="${alt}" data-node-id="${node.id}" />`
            case 'list':
                const ordered = (node as RichTextNode).attributes?.ordered || false
                const tag = ordered ? 'ol' : 'ul'
                return `<${tag} data-node-id="${node.id}">${this.getChildrenHtml(node)}</${tag}>`
            case 'listItem':
                return `<li data-node-id="${node.id}">${this.getNodeContent(node)}</li>`
            case 'blockquote':
                return `<blockquote data-node-id="${node.id}">${this.getNodeContent(node)}</blockquote>`
            case 'table':
                return `<table data-node-id="${node.id}">${this.getChildrenHtml(node)}</table>`
            case 'tableRow':
                return `<tr data-node-id="${node.id}">${this.getChildrenHtml(node)}</tr>`
            case 'tableCell':
                return `<td data-node-id="${node.id}">${this.getNodeContent(node)}</td>`
            case 'tableHeader':
                return `<th data-node-id="${node.id}">${this.getNodeContent(node)}</th>`
            case 'horizontalRule':
                return `<hr data-node-id="${node.id}" />`
            default:
                return `<div data-node-id="${node.id}">${this.getNodeContent(node)}</div>`
        }
    }

    /**
     * 获取节点内容
     * @param node AST节点
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
     * @param node AST节点
     */
    private getChildrenHtml(node: ASTNode): string {
        if (!node.children) return ''
        return node.children.map(child => this.nodeToHtml(child)).join('')
    }

    /**
     * 根据位置查找节点ID
     * @param position 位置
     */
    private findNodeIdAtPosition(position: number): string | null {
        for (const [nodeId, mapping] of this.nodePositionMap) {
            if (position >= mapping.start && position <= mapping.end) {
                return nodeId
            }
        }
        return null
    }

    /**
     * 获取当前AST
     * 从编辑器内容重建AST
     */
    private getCurrentAST(): DocumentAST {
        if (this.currentAST) {
            return this.currentAST
        }
        
        // 从编辑器内容重建AST
        const html = this.editor?.getHTML() || ''
        return this.htmlToAST(html)
    }

    /**
     * 将HTML转换为AST
     * @param html HTML内容
     */
    private htmlToAST(html: string): DocumentAST {
        if (!html.trim()) {
            return createDocumentAST('空文档')
        }

        try {
            // 创建临时DOM元素来解析HTML
            const tempDiv = document.createElement('div')
            tempDiv.innerHTML = html

            // 创建根节点
            const rootNode = createRichTextNode('group', '', {}, { x: 0, y: 0 })
            rootNode.children = []

            // 解析子节点
            const children = Array.from(tempDiv.children)
            for (const child of children) {
                const astNode = this.htmlElementToASTNode(child as HTMLElement)
                if (astNode) {
                    rootNode.children!.push(astNode)
                }
            }

            // 创建文档AST
            const documentAST: DocumentAST = {
                version: '1.0.0',
                type: 'document',
                id: `doc_${Date.now()}`,
                title: '当前文档',
                root: rootNode,
                metadata: {
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            }

            return documentAST
        } catch (error) {
            this.handleError(error as Error, 'htmlToAST')
            return createDocumentAST('解析失败')
        }
    }

    /**
     * 将HTML元素转换为AST节点
     * @param element HTML元素
     */
    private htmlElementToASTNode(element: HTMLElement): ASTNode | null {
        const nodeId = element.getAttribute('data-node-id') || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const tagName = element.tagName.toLowerCase()
        const textContent = element.textContent || ''

        switch (tagName) {
            case 'p':
                return createRichTextNode('paragraph', textContent, {}, { x: 0, y: 0 })
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6':
                const level = parseInt(tagName.charAt(1))
                return createRichTextNode('heading', textContent, { level }, { x: 0, y: 0 })
            case 'strong':
            case 'b':
                return createRichTextNode('bold', textContent, {}, { x: 0, y: 0 })
            case 'em':
            case 'i':
                return createRichTextNode('italic', textContent, {}, { x: 0, y: 0 })
            case 'u':
                return createRichTextNode('underline', textContent, {}, { x: 0, y: 0 })
            case 's':
            case 'del':
                return createRichTextNode('strikethrough', textContent, {}, { x: 0, y: 0 })
            case 'code':
                return createRichTextNode('code', textContent, {}, { x: 0, y: 0 })
            case 'pre':
                const codeElement = element.querySelector('code')
                const language = codeElement?.className?.replace('language-', '') || ''
                return createRichTextNode('codeBlock', textContent, { language }, { x: 0, y: 0 })
            case 'a':
                const href = element.getAttribute('href') || '#'
                return createRichTextNode('link', textContent, { href }, { x: 0, y: 0 })
            case 'img':
                const src = element.getAttribute('src') || ''
                const alt = element.getAttribute('alt') || ''
                return createRichTextNode('image', '', { src, alt }, { x: 0, y: 0 })
            case 'ul':
                return createRichTextNode('list', '', { ordered: false }, { x: 0, y: 0 })
            case 'ol':
                return createRichTextNode('list', '', { ordered: true }, { x: 0, y: 0 })
            case 'li':
                return createRichTextNode('listItem', textContent, {}, { x: 0, y: 0 })
            case 'blockquote':
                return createRichTextNode('blockquote', textContent, {}, { x: 0, y: 0 })
            case 'table':
                return createRichTextNode('table', '', {}, { x: 0, y: 0 })
            case 'tr':
                return createRichTextNode('tableRow', '', {}, { x: 0, y: 0 })
            case 'td':
                return createRichTextNode('tableCell', textContent, {}, { x: 0, y: 0 })
            case 'th':
                return createRichTextNode('tableHeader', textContent, {}, { x: 0, y: 0 })
            case 'hr':
                return createRichTextNode('horizontalRule', '', {}, { x: 0, y: 0 })
            default:
                // 对于未知标签，创建为div
                return createRichTextNode('paragraph', textContent, {}, { x: 0, y: 0 })
        }
    }

    /**
     * 重写错误处理方法，添加错误恢复机制
     */
    protected handleError(error: Error, context: string): void {
        const now = Date.now()
        this.errorCount++
        this.lastErrorTime = now
        
        console.error(`[${this.constructor.name}] Error in ${context}:`, error)
        
        // 如果错误过多，尝试恢复
        if (this.errorCount >= this.MAX_ERRORS) {
            this.attemptRecovery()
        }
        
        if (this.errorHandler) {
            this.errorHandler(error)
        } else {
            this.triggerEvent('error', error)
        }
    }

    /**
     * 重写渲染错误恢复方法
     */
    protected handleRenderingError(): void {
        // 强制重新渲染
        if (this.currentAST && this.editor) {
            setTimeout(() => {
                try {
                    this.render(this.currentAST!)
                    console.log(`[${this.constructor.name}] Rendering error recovery successful`)
                } catch (error) {
                    console.error('Re-render failed:', error)
                }
            }, 100)
        }
    }

    /**
     * 重写内存错误恢复方法
     */
    protected handleMemoryError(): void {
        // 清理缓存和映射
        this.nodePositionMap?.clear()
        this.contentUpdateQueue = []
        this.aiSuggestions = []
        
        // 强制垃圾回收（如果可用）
        if (window.gc) {
            window.gc()
        }
        
        console.log(`[${this.constructor.name}] Memory error recovery completed`)
    }

    /**
     * 重写用户交互错误恢复方法
     */
    protected handleUserInteractionError(): void {
        // 重置交互状态
        this.isUpdating = false
        this.isContentSyncing = false
        
        console.log(`[${this.constructor.name}] User interaction error recovery completed`)
    }

    /**
     * 尝试错误恢复
     */
    private attemptRecovery(): void {
        try {
            console.warn(`[${this.constructor.name}] Attempting error recovery...`)
            
            // 重新初始化位置映射
            this.initializePositionMapping()
            
            // 重置错误计数
            this.errorCount = 0
            
            // 触发恢复事件
            this.triggerEvent('viewChange', { type: 'recovery' })
            
        } catch (error) {
            console.error(`[${this.constructor.name}] Recovery failed:`, error)
            // 如果恢复失败，可能需要重新创建适配器
            this.triggerEvent('error', new Error('Recovery failed, adapter may need recreation'))
        }
    }

    /**
     * 验证节点位置映射的完整性
     */
    private validatePositionMapping(): boolean {
        try {
            if (!this.element) return false
            
            const mappedElements = new Set<string>()
            const domElements = new Set<string>()
            
            // 收集映射表中的元素
            for (const [nodeId, mapping] of this.nodePositionMap) {
                if (mapping.element) {
                    mappedElements.add(nodeId)
                }
            }
            
            // 收集DOM中的元素
            const walker = document.createTreeWalker(
                this.element,
                NodeFilter.SHOW_ELEMENT,
                {
                    acceptNode: (node) => {
                        const element = node as HTMLElement
                        return element.hasAttribute('data-node-id') 
                            ? NodeFilter.FILTER_ACCEPT 
                            : NodeFilter.FILTER_SKIP
                    }
                }
            )
            
            let node: Node | null
            while (node = walker.nextNode()) {
                const element = node as HTMLElement
                const nodeId = element.getAttribute('data-node-id')
                if (nodeId) {
                    domElements.add(nodeId)
                }
            }
            
            // 检查映射是否完整
            const missingInMap = Array.from(domElements).filter(id => !mappedElements.has(id))
            const extraInMap = Array.from(mappedElements).filter(id => !domElements.has(id))
            
            if (missingInMap.length > 0 || extraInMap.length > 0) {
                console.warn(`[${this.constructor.name}] Position mapping validation failed:`, {
                    missingInMap,
                    extraInMap
                })
                return false
            }
            
            return true
        } catch (error) {
            this.handleError(error as Error, 'validatePositionMapping')
            return false
        }
    }

    /**
     * 强制重新同步AST和视图
     */
    public forceResync(): void {
        try {
            console.log(`[${this.constructor.name}] Force resync initiated`)
            
            // 重新构建位置映射
            this.updatePositionMapping()
            
            // 验证映射完整性
            if (!this.validatePositionMapping()) {
                this.initializePositionMapping()
            }
            
            // 更新当前AST
            if (this.editor) {
                this.currentAST = this.htmlToAST(this.editor.getHTML())
            }
            
            this.triggerEvent('viewChange', { type: 'forceResync' })
            
        } catch (error) {
            this.handleError(error as Error, 'forceResync')
        }
    }

    /**
     * 获取AI处理状态
     */
    public getAIProcessingStatus(): boolean {
        return this.isAIProcessing
    }

    /**
     * 获取当前AI建议
     */
    public getCurrentAISuggestions(): AISuggestion[] {
        return [...this.aiSuggestions]
    }

    /**
     * 清除AI建议
     */
    public clearAISuggestions(): void {
        this.aiSuggestions = []
        this.triggerAIEvent('aiSuggestionsCleared', {})
    }

    /**
     * 批量更新节点
     * @param updates 更新列表
     */
    public batchUpdateNodes(updates: Array<{ nodeId: string; node: ASTNode }>): void {
        if (!this.validateInitialized() || !this.editor) return

        this.batchUpdate([() => {
            updates.forEach(({ nodeId, node }) => {
                this.updateNode(nodeId, node)
            })
        }])
    }

    /**
     * 获取编辑器统计信息
     */
    public getEditorStats(): any {
        if (!this.editor) return null

        const html = this.editor.getHTML()
        const wordCount = html.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length
        const charCount = html.replace(/<[^>]*>/g, '').length
        const nodeCount = this.nodePositionMap.size

        return {
            wordCount,
            charCount,
            nodeCount,
            isAIProcessing: this.isAIProcessing,
            aiSuggestionsCount: this.aiSuggestions.length,
            errorCount: this.errorCount
        }
    }
}

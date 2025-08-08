/**
 * 优化后的编辑器核心组件
 * 
 * 架构改进：
 * 1. 简化核心逻辑，专注于AST管理和适配器协调
 * 2. 使用组合模式而非继承，提高灵活性
 * 3. 改进错误边界和恢复机制
 * 4. 增强性能监控和内存管理
 * 5. 更好的类型安全和防御性编程
 */

import React, { useEffect, useRef, useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'
import { DocumentAST, Selection } from '@/components/Editor/types/EditorAST'
import { EditorTheme } from '@/components/Editor/types/EditorTheme'
import { CoreViewAdapter, AdapterState } from '@/components/Editor/adapters/BaseViewAdapter.optimized'
import { createAdapter } from '@/components/Editor/adapters/BaseViewAdapter.optimized'
import { ErrorHandlingMixin } from '@/components/Editor/mixins/ErrorHandlingMixin'
import { PerformanceMonitoringMixin } from '@/components/Editor/mixins/PerformanceMonitoringMixin'
import { AIMixin } from '@/components/Editor/mixins/AIMixin'
import { createDocumentAST } from '@/components/Editor/utils/ASTUtils'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'

/**
 * 编辑器状态枚举
 */
export enum EditorState {
    UNINITIALIZED = 'uninitialized',
    INITIALIZING = 'initializing',
    READY = 'ready',
    ERROR = 'error',
    DESTROYED = 'destroyed'
}

/**
 * 编辑器核心属性
 */
export interface OptimizedEditorCoreProps {
    /** 样式类名 */
    className?: string
    /** 内联样式 */
    style?: React.CSSProperties
    /** 初始AST数据 */
    initialAST?: DocumentAST
    /** 编辑器类型 */
    editorType?: EditorType
    /** 场景模板 */
    sceneTemplate?: SceneTemplate
    /** 主题设置 */
    theme?: EditorTheme
    /** 性能监控配置 */
    enablePerformanceMonitoring?: boolean
    /** 错误处理配置 */
    enableErrorRecovery?: boolean
    /** AST变化回调 */
    onASTChange?: (ast: DocumentAST) => void
    /** 选择状态变化回调 */
    onSelectionChange?: (selection: Selection) => void
    /** 状态变化回调 */
    onStateChange?: (state: EditorState) => void
    /** 错误处理回调 */
    onError?: (error: Error, context: string) => void
}

/**
 * 对外暴露的编辑器命令接口
 */
export interface OptimizedEditorCommands {
    // 状态查询
    getState(): EditorState
    isReady(): boolean
    
    // AST 操作
    getAST(): DocumentAST | null
    setAST(ast: DocumentAST): Promise<void>
    
    // 选择操作
    getSelection(): Selection | null
    setSelection(selection: Selection): Promise<void>
    
    // 视图操作
    focus(): void
    blur(): void
    
    // 错误和性能
    getErrorStats(): any
    getPerformanceStats(): any
    
    // AI 功能
    requestAICompletion(context: string, position: number): Promise<string>
    getAISuggestions(context?: string): Promise<any[]>
    
    // 恢复操作
    recover(): Promise<boolean>
    reset(): Promise<void>
}

/**
 * 编辑器管理器类
 * 负责协调各个功能模块
 */
class EditorManager {
    private errorHandler: ErrorHandlingMixin
    private performanceMonitor: PerformanceMonitoringMixin
    private aiManager: AIMixin
    
    constructor() {
        this.errorHandler = new ErrorHandlingMixin()
        this.performanceMonitor = new PerformanceMonitoringMixin()
        this.aiManager = new AIMixin()
        
        this.initializeModules()
    }
    
    private initializeModules(): void {
        // 初始化错误处理
        this.errorHandler.configureErrorHandling({
            maxHistorySize: 100,
            maxRetryAttempts: 3,
            enableAutoRecovery: true,
            recoveryDelay: 1000,
            errorThreshold: 5
        })
        
        // 初始化性能监控
        this.performanceMonitor.configurePerformanceMonitoring({
            enableProfiling: true,
            maxMetricsHistory: 500,
            slowOperationThreshold: 100,
            memoryWarningThreshold: 50 * 1024 * 1024,
            samplingInterval: 2000
        })
        
        // 初始化AI功能
        this.aiManager.configureAI({
            timeout: 30000,
            maxRetries: 3,
            temperature: 0.7
        })
    }
    
    public getErrorHandler(): ErrorHandlingMixin {
        return this.errorHandler
    }
    
    public getPerformanceMonitor(): PerformanceMonitoringMixin {
        return this.performanceMonitor
    }
    
    public getAIManager(): AIMixin {
        return this.aiManager
    }
    
    public destroy(): void {
        this.performanceMonitor.stopMonitoring()
        this.errorHandler.clearErrorHistory()
        this.aiManager.cancelAllAIRequests()
    }
}

/**
 * 优化后的编辑器核心组件
 */
const OptimizedEditorCore = forwardRef<OptimizedEditorCommands, OptimizedEditorCoreProps>(
    function OptimizedEditorCore({
        className = '',
        style = {},
        initialAST,
        editorType = EditorType.RICH_TEXT,
        sceneTemplate = SceneTemplate.WRITING,
        theme = 'auto',
        enablePerformanceMonitoring = true,
        enableErrorRecovery = true,
        onASTChange,
        onSelectionChange,
        onStateChange,
        onError,
    }, ref) {
        
        // === 状态管理 ===
        const [editorState, setEditorState] = useState<EditorState>(EditorState.UNINITIALIZED)
        const [ast, setAST] = useState<DocumentAST>(() => initialAST || createDocumentAST())
        const [selection, setSelection] = useState<Selection>({ nodeIds: [], type: 'node' })
        const [error, setError] = useState<Error | null>(null)
        
        // === 引用管理 ===
        const containerRef = useRef<HTMLDivElement>(null)
        const adapterRef = useRef<CoreViewAdapter | null>(null)
        const managerRef = useRef<EditorManager | null>(null)
        
        // === 主题管理 ===
        const { theme: appTheme } = useTheme()
        const effectiveTheme: EditorTheme = useMemo(() => {
            if (theme === 'auto') {
                return appTheme === 'system' ? 'auto' : (appTheme as EditorTheme)
            }
            return theme
        }, [theme, appTheme])
        
        // === 状态更新函数 ===
        const updateEditorState = useCallback((newState: EditorState) => {
            setEditorState(newState)
            onStateChange?.(newState)
        }, [onStateChange])
        
        const handleError = useCallback((error: Error, context: string) => {
            console.error(`[EditorCore] Error in ${context}:`, error)
            setError(error)
            updateEditorState(EditorState.ERROR)
            
            // 使用错误处理器
            if (managerRef.current) {
                managerRef.current.getErrorHandler().handleError(error, context)
            }
            
            onError?.(error, context)
        }, [updateEditorState, onError])
        
        // === 适配器管理 ===
        const createAdapterInstance = useCallback(async () => {
            if (!containerRef.current) {
                throw new Error('Container element not found')
            }
            
            updateEditorState(EditorState.INITIALIZING)
            
            try {
                // 创建增强的适配器
                const AdapterClass = createAdapter(
                    class extends CoreViewAdapter {
                        public readonly type = editorType
                        public readonly capabilities = {
                            canEdit: true,
                            canSelect: true,
                            canZoom: true,
                            canDrag: true,
                            supportsUndo: true,
                            supportsSearch: true,
                            supportsAI: true
                        }
                        
                        protected async performCreate(): Promise<void> {
                            // 子类实现
                        }
                        
                        protected performDestroy(): void {
                            // 子类实现
                        }
                        
                        protected performRender(): void {
                            // 子类实现
                        }
                        
                        protected performUpdateNode(): void {
                            // 子类实现
                        }
                        
                        protected performRemoveNode(): void {
                            // 子类实现
                        }
                        
                        protected performAddNode(): void {
                            // 子类实现
                        }
                        
                        protected performSetSelection(): void {
                            // 子类实现
                        }
                        
                        protected performGetSelection(): Selection {
                            return { nodeIds: [], type: 'node' }
                        }
                        
                        protected performFocus(): void {
                            // 子类实现
                        }
                        
                        protected performBlur(): void {
                            // 子类实现
                        }
                        
                        protected performGetViewport() {
                            return { x: 0, y: 0, width: 0, height: 0, zoom: 1 }
                        }
                        
                        protected performSetViewport(): void {
                            // 子类实现
                        }
                    }
                )
                    .withErrorHandling()
                    .withPerformanceMonitoring()
                    .withAI()
                    .build()
                
                const adapter = new AdapterClass(sceneTemplate)
                
                // 设置生命周期钩子
                adapter.setHooks({
                    beforeCreate: async () => {
                        if (enablePerformanceMonitoring && managerRef.current) {
                            managerRef.current.getPerformanceMonitor().startMonitoring()
                        }
                    },
                    created: async () => {
                        updateEditorState(EditorState.READY)
                    },
                    beforeDestroy: async () => {
                        updateEditorState(EditorState.DESTROYED)
                    }
                })
                
                // 设置事件监听
                adapter.on('stateChange', (state: AdapterState) => {
                    console.debug(`[EditorCore] Adapter state: ${state}`)
                })
                
                adapter.on('selectionChange', (newSelection: Selection) => {
                    setSelection(newSelection)
                    onSelectionChange?.(newSelection)
                })
                
                adapter.on('error', (error: Error) => {
                    handleError(error, 'adapter')
                })
                
                // 创建适配器
                await adapter.create(containerRef.current, {
                    type: editorType,
                    sceneTemplate,
                    theme: effectiveTheme,
                    enableSelection: true,
                    enableDrag: true,
                    enableResize: true,
                    enableContextMenu: true
                })
                
                // 渲染初始AST
                await adapter.render(ast)
                
                adapterRef.current = adapter
                
            } catch (error) {
                handleError(error as Error, 'createAdapter')
                throw error
            }
        }, [editorType, sceneTemplate, effectiveTheme, ast, enablePerformanceMonitoring, updateEditorState, handleError, onSelectionChange])
        
        const destroyAdapter = useCallback(async () => {
            if (adapterRef.current) {
                try {
                    await adapterRef.current.destroy()
                } catch (error) {
                    console.error('Error destroying adapter:', error)
                }
                adapterRef.current = null
            }
        }, [])
        
        // === AST 管理 ===
        const updateAST = useCallback(async (newAST: DocumentAST) => {
            if (!adapterRef.current?.isReady()) {
                throw new Error('Adapter not ready for AST update')
            }
            
            const operationId = managerRef.current?.getPerformanceMonitor().startOperation('updateAST')
            
            try {
                await adapterRef.current.render(newAST)
                setAST(newAST)
                onASTChange?.(newAST)
                
                if (operationId) {
                    managerRef.current?.getPerformanceMonitor().endOperation(operationId, true)
                }
            } catch (error) {
                if (operationId) {
                    managerRef.current?.getPerformanceMonitor().endOperation(operationId, false, (error as Error).message)
                }
                throw error
            }
        }, [onASTChange])
        
        // === 恢复机制 ===
        const recover = useCallback(async (): Promise<boolean> => {
            try {
                console.log('[EditorCore] Attempting recovery...')
                
                // 销毁当前适配器
                await destroyAdapter()
                
                // 重新创建适配器
                await createAdapterInstance()
                
                console.log('[EditorCore] Recovery successful')
                return true
                
            } catch (error) {
                console.error('[EditorCore] Recovery failed:', error)
                return false
            }
        }, [destroyAdapter, createAdapterInstance])
        
        const reset = useCallback(async (): Promise<void> => {
            try {
                // 重置所有状态
                setError(null)
                setSelection({ nodeIds: [], type: 'node' })
                
                // 清理管理器
                if (managerRef.current) {
                    managerRef.current.getErrorHandler().clearErrorHistory()
                    managerRef.current.getPerformanceMonitor().clearMetrics()
                    managerRef.current.getAIManager().clearAISuggestions()
                }
                
                // 重新初始化
                await recover()
                
            } catch (error) {
                handleError(error as Error, 'reset')
                throw error
            }
        }, [recover, handleError])
        
        // === 命令接口实现 ===
        const commands: OptimizedEditorCommands = useMemo(() => ({
            getState: () => editorState,
            isReady: () => editorState === EditorState.READY,
            
            getAST: () => ast,
            setAST: updateAST,
            
            getSelection: () => adapterRef.current?.getSelection() || null,
            setSelection: async (selection: Selection) => {
                if (adapterRef.current?.isReady()) {
                    adapterRef.current.setSelection(selection)
                }
            },
            
            focus: () => adapterRef.current?.focus(),
            blur: () => adapterRef.current?.blur(),
            
            getErrorStats: () => managerRef.current?.getErrorHandler().getErrorStats() || {},
            getPerformanceStats: () => managerRef.current?.getPerformanceMonitor().getPerformanceStats() || {},
            
            requestAICompletion: async (context: string, position: number) => {
                if (!managerRef.current) throw new Error('AI manager not available')
                return managerRef.current.getAIManager().requestAICompletion(context, position)
            },
            
            getAISuggestions: async (context?: string) => {
                if (!managerRef.current) throw new Error('AI manager not available')
                return managerRef.current.getAIManager().getAISuggestions(context)
            },
            
            recover,
            reset
        }), [editorState, ast, updateAST, recover, reset])
        
        // === 生命周期管理 ===
        useEffect(() => {
            // 初始化管理器
            managerRef.current = new EditorManager()
            
            // 创建适配器
            createAdapterInstance().catch(error => {
                handleError(error, 'initialization')
            })
            
            return () => {
                // 清理资源
                destroyAdapter()
                if (managerRef.current) {
                    managerRef.current.destroy()
                    managerRef.current = null
                }
            }
        }, [createAdapterInstance, destroyAdapter, handleError])
        
        // === 暴露命令接口 ===
        useImperativeHandle(ref, () => commands, [commands])
        
        // === 错误边界渲染 ===
        if (error && editorState === EditorState.ERROR) {
            return (
                <div className={`editor-error-boundary ${className}`} style={style}>
                    <div className="flex items-center justify-center h-full p-6">
                        <div className="text-center max-w-md">
                            <div className="text-destructive text-xl font-semibold mb-3">
                                编辑器加载失败
                            </div>
                            <div className="text-muted-foreground text-sm mb-4 break-words">
                                {error.message}
                            </div>
                            <div className="flex gap-2 justify-center">
                                <Button 
                                    onClick={recover}
                                    variant="default"
                                    size="sm"
                                >
                                    尝试恢复
                                </Button>
                                <Button 
                                    onClick={reset}
                                    variant="outline"
                                    size="sm"
                                >
                                    重置编辑器
                                </Button>
                            </div>
                            {enableErrorRecovery && (
                                <div className="text-xs text-muted-foreground mt-3">
                                    自动恢复已启用，系统会尝试自动修复问题
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
        }
        
        // === 主渲染 ===
        return (
            <div 
                ref={containerRef}
                className={`editor-container relative ${className}`} 
                style={style}
                data-editor-type={editorType}
                data-scene-template={sceneTemplate}
                data-state={editorState}
            >
                {/* 加载状态 */}
                {editorState === EditorState.INITIALIZING && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <div className="text-sm text-muted-foreground">
                                正在初始化 {editorType} 编辑器...
                            </div>
                        </div>
                    </div>
                )}
                
                {/* 适配器渲染区域 */}
                <div className="editor-viewport w-full h-full">
                    {adapterRef.current && editorState === EditorState.READY && (
                        <div className="w-full h-full">
                            {/* 适配器内容会在这里渲染 */}
                        </div>
                    )}
                </div>
                
                {/* 状态栏 */}
                <div className="editor-statusbar absolute bottom-0 left-0 right-0 bg-muted/50 border-t px-3 py-1 text-xs flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <span className="font-medium">
                            {editorType}
                        </span>
                        <span className="text-muted-foreground">
                            选中: {selection.nodeIds.length} 个节点
                        </span>
                        <span className="text-muted-foreground">
                            状态: {editorState}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {enablePerformanceMonitoring && (
                            <span className="text-muted-foreground">
                                性能监控已启用
                            </span>
                        )}
                        {enableErrorRecovery && (
                            <span className="text-muted-foreground">
                                自动恢复已启用
                            </span>
                        )}
                        <span className="text-muted-foreground">
                            主题: {effectiveTheme}
                        </span>
                    </div>
                </div>
            </div>
        )
    }
)

export default OptimizedEditorCore

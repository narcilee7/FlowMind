/**
 * EditorKit - 统一的编辑器集成层
 * 
 * 这是一个高层次的集成组件，提供：
 * 1. 零配置的编辑器初始化
 * 2. 智能场景推荐和自动切换
 * 3. 统一的 API 接口
 * 4. 内置性能优化和监控
 * 5. 完整的错误处理和恢复
 * 6. AI Native Editor 开箱即用
 */

import React, { 
    useEffect, 
    useRef, 
    useState, 
    useImperativeHandle, 
    forwardRef,
    useCallback,
    useMemo
} from 'react'
import { optimizedAdapterFactory } from './core/ViewAdapterFactory.optimized'
import { CoreViewAdapter, ErrorHandlingMixin, PerformanceMonitoringMixin, AIMixin } from './adapters/BaseViewAdapter.optimized'
import EditorStateManager from './state/EditorStateManager'
import PluginSystem from './plugins/PluginSystem'
import { EditorType, SceneTemplate } from './types/EditorType'
import { DocumentAST, ASTNode, Selection } from './types/EditorAST'
import { createDefaultOptimizationConfig, PerformanceOptimizer } from './utils/PerformanceOptimizer'
import { createDocumentAST } from './utils/ASTUtils'

/**
 * 编辑器配置接口
 */
export interface EditorKitConfig {
    // 基础配置
    initialType?: EditorType
    sceneTemplate?: SceneTemplate
    autoDetectScene?: boolean
    
    // 功能开关
    enableAI?: boolean
    enablePerformanceMonitoring?: boolean
    enableErrorHandling?: boolean
    enableAutoSave?: boolean
    
    // AI 配置
    aiConfig?: {
        apiKey?: string
        model?: string
        temperature?: number
        maxTokens?: number
    }
    
    // 性能配置
    performanceConfig?: {
        enableVirtualScrolling?: boolean
        virtualScrollThreshold?: number
        batchUpdateDelay?: number
    }
    
    // 样式配置
    theme?: 'light' | 'dark' | 'auto'
    className?: string
    style?: React.CSSProperties
    
    // 事件回调
    onChange?: (ast: DocumentAST) => void
    onSelectionChange?: (selection: Selection) => void
    onError?: (error: Error) => void
    onReady?: (editor: EditorKitHandle) => void
    onSceneChange?: (newScene: SceneTemplate, oldScene: SceneTemplate) => void
}

/**
 * 编辑器句柄接口
 */
export interface EditorKitHandle {
    // 内容操作
    getContent(): DocumentAST
    setContent(ast: DocumentAST): void
    clear(): void
    
    // 选择操作
    getSelection(): Selection
    setSelection(selection: Selection): void
    
    // 编辑器切换
    switchEditor(type: EditorType): Promise<void>
    getRecommendedEditors(): Array<{ type: EditorType; confidence: number; reason: string }>
    
    // AI 功能
    requestAICompletion(context?: string): Promise<string>
    requestAIRewrite(style?: string): Promise<string>
    getAISuggestions(): Promise<string[]>
    
    // 状态查询
    isReady(): boolean
    getAdapterType(): EditorType
    getSceneTemplate(): SceneTemplate
    
    // 性能相关
    getPerformanceStats(): any
    getHealthStatus(): any
    
    // 工具功能
    focus(): void
    blur(): void
    undo(): void
    redo(): void
    
    // 导出功能
    exportToJSON(): string
    exportToHTML(): Promise<string>
    exportToMarkdown(): Promise<string>
}

/**
 * 编辑器状态
 */
interface EditorState {
    isReady: boolean
    currentType: EditorType
    sceneTemplate: SceneTemplate
    content: DocumentAST
    selection: Selection
    isLoading: boolean
    error: Error | null
}

/**
 * EditorKit 主组件
 */
export const EditorKit = forwardRef<EditorKitHandle, EditorKitConfig>((props, ref) => {
    const {
        initialType = EditorType.RICH_TEXT,
        sceneTemplate = SceneTemplate.WRITING,
        autoDetectScene = true,
        enableAI = true,
        enablePerformanceMonitoring = true,
        enableErrorHandling = true,
        enableAutoSave: _enableAutoSave = false,
        theme = 'auto',
        className = '',
        style = {},
        onChange,
        onSelectionChange,
        onError,
        onReady,
        onSceneChange,
        aiConfig: _aiConfig,
        performanceConfig
    } = props

    // 容器引用
    const containerRef = useRef<HTMLDivElement>(null)
    const stateManagerRef = useRef<EditorStateManager | null>(null)
    const pluginSystemRef = useRef<PluginSystem | null>(null)
    
    // 适配器实例
    type AdapterInstance = CoreViewAdapter & Partial<ErrorHandlingMixin & PerformanceMonitoringMixin & AIMixin> & { checkPerformanceHealth?: () => any }
    const [adapter, setAdapter] = useState<AdapterInstance | null>(null)
    
    // 性能优化器
    const performanceOptimizer = useMemo(() => {
        return new PerformanceOptimizer({
            ...createDefaultOptimizationConfig(),
            ...performanceConfig
        })
    }, [performanceConfig])
    
    // 编辑器状态
    const [state, setState] = useState<EditorState>({
        isReady: false,
        currentType: initialType,
        sceneTemplate,
        content: createDocumentAST(),
        selection: { nodeIds: [], type: 'node' },
        isLoading: false,
        error: null
    })

    /**
     * 智能场景检测
     */
    const detectScene = useCallback((content: DocumentAST): SceneTemplate => {
        if (!autoDetectScene) return sceneTemplate

        // 简化的场景检测逻辑
        const textContent = extractTextContent(content)
        const wordCount = textContent.split(/\s+/).length
        
        // 基于内容特征检测场景
        if (textContent.includes('TODO') || textContent.includes('任务') || textContent.includes('计划')) {
            return SceneTemplate.PLANNING
        }
        
        if (textContent.includes('研究') || textContent.includes('分析') || textContent.includes('调研')) {
            return SceneTemplate.RESEARCH
        }
        
        if (wordCount > 100 && (textContent.includes('文章') || textContent.includes('写作'))) {
            return SceneTemplate.WRITING
        }
        
        if (textContent.includes('学习') || textContent.includes('笔记') || textContent.includes('总结')) {
            return SceneTemplate.LEARNING
        }
        
        if (textContent.includes('创意') || textContent.includes('设计') || textContent.includes('想法')) {
            return SceneTemplate.CREATIVE
        }
        
        return sceneTemplate
    }, [autoDetectScene, sceneTemplate])

    /**
     * 创建编辑器适配器
     */
    const createAdapter = useCallback(async (
        type: EditorType,
        scene: SceneTemplate
    ): Promise<AdapterInstance> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }))
        
        try {
            const newAdapter = await optimizedAdapterFactory.createAdapter(type, {
                sceneTemplate: scene,
                enableErrorHandling,
                enablePerformanceMonitoring,
                enableAI,
                onError: (error) => {
                    setState(prev => ({ ...prev, error }))
                    onError?.(error)
                },
                onProgress: (progress) => {
                    console.log('[EditorKit] Loading progress:', progress.message)
                }
            }) as AdapterInstance

            // 配置适配器
            if (containerRef.current) {
                await newAdapter.create(containerRef.current, {
                    theme: theme === 'auto' ? getSystemTheme() : theme,
                    autoFocus: true
                } as any)
            }

            // 设置事件监听
            setupAdapterEvents(newAdapter)
            
            setState(prev => ({ 
                ...prev, 
                isReady: true, 
                isLoading: false,
                currentType: type,
                sceneTemplate: scene
            }))
            
            return newAdapter
            
        } catch (error) {
            setState(prev => ({ 
                ...prev, 
                isLoading: false, 
                error: error as Error 
            }))
            throw error
        }
    }, [enableErrorHandling, enablePerformanceMonitoring, enableAI, theme, onError])

    /**
     * 设置适配器事件监听
     */
    const setupAdapterEvents = useCallback((adapterInstance: AdapterInstance) => {
        // 内容变化事件
        adapterInstance.on('viewChange', (data) => {
            if (data.type === 'contentUpdate') {
                // 优先从适配器读取结构化 AST；否则回退到状态
                const nextAST = typeof (adapterInstance as any).getAST === 'function'
                    ? (adapterInstance as any).getAST()
                    : state.content
                setState(prev => ({ ...prev, content: nextAST }))
                onChange?.(nextAST)
                // 智能场景检测
                if (autoDetectScene) {
                    const detectedScene = detectScene(nextAST)
                    if (detectedScene !== state.sceneTemplate) {
                        handleSceneChange(detectedScene)
                    }
                }

                // 添加快照（标记内容更新）
                if (stateManagerRef.current) {
                    stateManagerRef.current.addSnapshot(
                        nextAST,
                        state.selection,
                        state.currentType,
                        state.sceneTemplate,
                        'contentUpdate'
                    )
                }
            }
        })

        // 选择变化事件
        adapterInstance.on('selectionChange', (selection) => {
            setState(prev => ({ ...prev, selection }))
            onSelectionChange?.(selection)

            // 可选：对选择变化添加轻量快照（避免频繁写入，这里仅记录操作名）
            if (stateManagerRef.current) {
                stateManagerRef.current.addSnapshot(
                    state.content,
                    selection,
                    state.currentType,
                    state.sceneTemplate,
                    'selectionChange'
                )
            }
        })

        // 错误事件
        adapterInstance.on('error', (error) => {
            setState(prev => ({ ...prev, error }))
            onError?.(error)
        })

        // 性能监控
        if (enablePerformanceMonitoring && 'getPerformanceStats' in adapterInstance && adapterInstance.getPerformanceStats) {
            const stats = adapterInstance.getPerformanceStats()
            console.log('[EditorKit] Performance stats:', stats)
        }
    }, [state.content, state.sceneTemplate, onChange, onSelectionChange, onError, autoDetectScene, detectScene, enablePerformanceMonitoring])

    /**
     * 处理场景变化
     */
    const handleSceneChange = useCallback(async (newScene: SceneTemplate) => {
        if (newScene === state.sceneTemplate) return

        const oldScene = state.sceneTemplate
        onSceneChange?.(newScene, oldScene)

        // 获取推荐的编辑器类型
        const recommendations = optimizedAdapterFactory.getRecommendedTypes(newScene)
        if (recommendations.length > 0 && recommendations[0].confidence > 0.8) {
            const recommendedType = recommendations[0].type
            if (recommendedType !== state.currentType) {
                console.log(`[EditorKit] Switching to ${recommendedType} for scene ${newScene}`)
                await switchEditor(recommendedType)
            }
        }

        setState(prev => ({ ...prev, sceneTemplate: newScene }))
    }, [state.sceneTemplate, state.currentType, onSceneChange])

    /**
     * 切换编辑器
     */
    const switchEditor = useCallback(async (type: EditorType) => {
        if (!adapter || type === state.currentType) return

        setState(prev => ({ ...prev, isLoading: true }))

        try {
            // 保存当前内容
            const currentContent = state.content
            
            // 销毁当前适配器
            await adapter.destroy()
            
            // 创建新适配器
            const newAdapter = await createAdapter(type, state.sceneTemplate)
            
            // 恢复内容
            if (currentContent) {
                await newAdapter.render(currentContent)
            }
            
            setAdapter(newAdapter)
            
        } catch (error) {
            console.error('[EditorKit] Failed to switch editor:', error)
            setState(prev => ({ ...prev, error: error as Error, isLoading: false }))
        }
    }, [adapter, state.currentType, state.content, state.sceneTemplate, createAdapter])

    /**
     * 初始化编辑器
     */
    useEffect(() => {
        if (!containerRef.current) return

        // 初始化状态管理器
        stateManagerRef.current = new EditorStateManager({
            enablePersistence: true,
            autoSaveInterval: 30000,
            maxHistorySize: 200
        })

        // 初始化插件系统
        pluginSystemRef.current = new PluginSystem()

        createAdapter(initialType, sceneTemplate)
            .then(adapterInstance => {
                setAdapter(adapterInstance)
                // 初始化插件系统上下文
                pluginSystemRef.current!.initialize(adapterInstance)
                pluginSystemRef.current!.setASTProvider(() => state.content)
                onReady?.({
                    getContent: () => state.content,
                    setContent: async (ast) => {
                        if (adapterInstance) {
                            await adapterInstance.render(ast)
                            setState(prev => ({ ...prev, content: ast }))
                            // 内容设置也添加快照
                            stateManagerRef.current?.addSnapshot(
                                ast,
                                state.selection,
                                state.currentType,
                                state.sceneTemplate,
                                'setContent'
                            )
                        }
                    },
                    clear: () => {
                        const emptyAST = createDocumentAST()
                        if (adapterInstance) {
                            adapterInstance.render(emptyAST)
                            setState(prev => ({ ...prev, content: emptyAST }))
                            stateManagerRef.current?.addSnapshot(
                                emptyAST,
                                state.selection,
                                state.currentType,
                                state.sceneTemplate,
                                'clear'
                            )
                        }
                    },
                    getSelection: () => state.selection,
                    setSelection: (selection) => {
                        if (adapterInstance) {
                            adapterInstance.setSelection(selection)
                        }
                    },
                    switchEditor,
                    getRecommendedEditors: () => optimizedAdapterFactory.getRecommendedTypes(state.sceneTemplate),
                    requestAICompletion: async (context) => {
                        if (adapterInstance && 'requestAICompletion' in adapterInstance && adapterInstance.requestAICompletion) {
                            return await adapterInstance.requestAICompletion(context || '', 0)
                        }
                        throw new Error('AI completion not available')
                    },
                    requestAIRewrite: async (style) => {
                        if (adapterInstance && 'requestAIRewrite' in adapterInstance && adapterInstance.requestAIRewrite) {
                            return await adapterInstance.requestAIRewrite(extractTextContent(state.content), style || 'improve')
                        }
                        throw new Error('AI rewrite not available')
                    },
                    getAISuggestions: async () => {
                        if (adapterInstance && 'getAISuggestions' in adapterInstance && adapterInstance.getAISuggestions) {
                            const suggestions = await adapterInstance.getAISuggestions()
                            return (suggestions as any[]).map((s: any) => typeof s === 'string' ? s : s.text || '')
                        }
                        return []
                    },
                    isReady: () => state.isReady,
                    getAdapterType: () => state.currentType,
                    getSceneTemplate: () => state.sceneTemplate,
                    getPerformanceStats: () => {
                        if (adapterInstance && 'getPerformanceStats' in adapterInstance && adapterInstance.getPerformanceStats) {
                            return adapterInstance.getPerformanceStats()
                        }
                        return performanceOptimizer.getPerformanceStats()
                    },
                    getHealthStatus: () => {
                        if (adapterInstance && 'checkPerformanceHealth' in adapterInstance && adapterInstance.checkPerformanceHealth) {
                            return adapterInstance.checkPerformanceHealth()
                        }
                        return { isHealthy: true, issues: [] }
                    },
                    focus: () => adapterInstance?.focus(),
                    blur: () => adapterInstance?.blur(),
                    undo: () => {
                        const snapshot = stateManagerRef.current?.undo()
                        if (snapshot?.ast && adapterInstance) {
                            adapterInstance.render(snapshot.ast)
                            setState(prev => ({ ...prev, content: snapshot.ast }))
                        }
                    },
                    redo: () => {
                        const snapshot = stateManagerRef.current?.redo()
                        if (snapshot?.ast && adapterInstance) {
                            adapterInstance.render(snapshot.ast)
                            setState(prev => ({ ...prev, content: snapshot.ast }))
                        }
                    },
                    exportToJSON: () => JSON.stringify(state.content, null, 2),
                    exportToHTML: async () => {
                        const { ASTExporter } = await import('./utils/ASTExporter')
                        const result = ASTExporter.exportToHTML(state.content)
                        return result.success ? result.content : `<div>导出失败: ${result.error}</div>`
                    },
                    exportToMarkdown: async () => {
                        const { ASTExporter } = await import('./utils/ASTExporter')
                        const result = ASTExporter.exportToMarkdown(state.content)
                        return result.success ? result.content : `# 导出失败: ${result.error}`
                    }
                } as EditorKitHandle)
            })
            .catch(error => {
                console.error('[EditorKit] Failed to initialize:', error)
                setState(prev => ({ ...prev, error: error as Error, isLoading: false }))
            })

        return () => {
            adapter?.destroy()
            performanceOptimizer.destroy()
            stateManagerRef.current?.destroy()
        }
    }, []) // 仅在组件挂载时执行

    // 暴露编辑器句柄
    useImperativeHandle(ref, () => ({
        getContent: () => state.content,
        setContent: async (ast) => {
            if (adapter) {
                await adapter.render(ast)
                setState(prev => ({ ...prev, content: ast }))
            }
        },
        clear: () => {
            const emptyAST = createDocumentAST()
            if (adapter) {
                adapter.render(emptyAST)
                setState(prev => ({ ...prev, content: emptyAST }))
            }
        },
        getSelection: () => state.selection,
        setSelection: (selection) => adapter?.setSelection(selection),
        switchEditor,
        getRecommendedEditors: () => optimizedAdapterFactory.getRecommendedTypes(state.sceneTemplate),
        requestAICompletion: async (context) => {
            if (adapter && (adapter as any).requestAICompletion) {
                return await (adapter as any).requestAICompletion(context || '', 0)
            }
            throw new Error('AI completion not available')
        },
        requestAIRewrite: async (style) => {
            if (adapter && (adapter as any).requestAIRewrite) {
                return await (adapter as any).requestAIRewrite(extractTextContent(state.content), style || 'improve')
            }
            throw new Error('AI rewrite not available')
        },
        getAISuggestions: async () => {
            if (adapter && (adapter as any).getAISuggestions) {
                const suggestions = await (adapter as any).getAISuggestions()
                return suggestions.map((s: any) => typeof s === 'string' ? s : s.text || '')
            }
            return []
        },
        isReady: () => state.isReady,
        getAdapterType: () => state.currentType,
        getSceneTemplate: () => state.sceneTemplate,
        getPerformanceStats: () => {
            if (adapter && (adapter as any).getPerformanceStats) {
                return (adapter as any).getPerformanceStats()
            }
            return performanceOptimizer.getPerformanceStats()
        },
        getHealthStatus: () => {
            if (adapter && (adapter as any).checkPerformanceHealth) {
                return (adapter as any).checkPerformanceHealth()
            }
            return { isHealthy: true, issues: [] }
        },
        focus: () => adapter?.focus(),
        blur: () => adapter?.blur(),
        undo: () => console.log('Undo operation'),
        redo: () => console.log('Redo operation'),
        exportToJSON: () => JSON.stringify(state.content, null, 2),
        exportToHTML: async () => {
            const { ASTExporter } = await import('./utils/ASTExporter')
            const result = ASTExporter.exportToHTML(state.content)
            return result.success ? result.content : `<div>导出失败: ${result.error}</div>`
        },
        exportToMarkdown: async () => {
            const { ASTExporter } = await import('./utils/ASTExporter')
            const result = ASTExporter.exportToMarkdown(state.content)
            return result.success ? result.content : `# 导出失败: ${result.error}`
        }
    } as EditorKitHandle), [adapter, state, switchEditor, performanceOptimizer])

    // 渲染加载状态
    if (state.isLoading) {
        return (
            <div className={`editor-kit loading ${className}`} style={style}>
                <div className="loading-indicator">
                    <div className="loading-spinner"></div>
                    <span>正在加载编辑器...</span>
                </div>
            </div>
        )
    }

    // 渲染错误状态
    if (state.error) {
        return (
            <div className={`editor-kit error ${className}`} style={style}>
                <div className="error-message">
                    <h3>编辑器加载失败</h3>
                    <p>{state.error.message}</p>
                    <button onClick={() => setState(prev => ({ ...prev, error: null }))}>
                        重试
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div 
            className={`editor-kit ${theme} ${className}`} 
            style={style}
            data-scene={state.sceneTemplate}
            data-editor-type={state.currentType}
        >
            {/* 编辑器容器 */}
            <div 
                ref={containerRef} 
                className="editor-container"
                style={{ width: '100%', height: '100%' }}
            />
            
            {/* 状态指示器 */}
            {enablePerformanceMonitoring && (
                <div className="editor-status-bar">
                    <span className="scene-indicator">场景: {state.sceneTemplate}</span>
                    <span className="editor-indicator">编辑器: {state.currentType}</span>
                    {state.isReady && <span className="ready-indicator">●</span>}
                </div>
            )}
        </div>
    )
})

EditorKit.displayName = 'EditorKit'

// === 工具函数 ===

/**
 * 提取文本内容
 */
function extractTextContent(ast: DocumentAST): string {
    const extractFromNode = (node: ASTNode): string => {
        let text = ''
        
        if ('content' in node && typeof node.content === 'string') {
            text += node.content
        }
        
        if (node.children) {
            text += node.children.map(extractFromNode).join(' ')
        }
        
        return text
    }
    
    return extractFromNode(ast.root).trim()
}

/**
 * 获取系统主题
 */
function getSystemTheme(): 'light' | 'dark' {
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
}

/**
 * 根据场景获取占位符文本
 */
// 占位符已由具体适配器实现或主题占位，移除未使用的辅助

export default EditorKit

/**
 * 编辑器核心渲染基础组件 - 基于ViewAdapter架构
 * 
 * 架构设计原则：
 * 1. AST作为通信核心，适配器只负责视图渲染
 * 2. 单一职责：EditorCore专注于AST管理和适配器协调
 * 3. 依赖注入：通过props注入依赖，便于测试和扩展
 * 4. 错误边界：统一的错误处理和恢复机制
 * 
 * 核心职责：
 * - AST状态管理（创建、更新、同步）
 * - 适配器生命周期管理（创建、销毁、切换）
 * - 事件协调（选择、视图变化、错误处理）
 * - 主题和配置管理
 */

import React, { useEffect, useRef, useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import { ViewAdapter } from '@/components/Editor/types/ViewAdapter'
import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'
import { DocumentAST, Selection } from '@/components/Editor/types/EditorAST'
import { EditorTheme } from '@/components/Editor/types/EditorTheme'
import ViewAdapterFactory from '@/components/Editor/core/ViewAdapterFactory'
import { createDocumentAST, createRichTextNode } from '@/components/Editor/utils/ASTUtils'
import { EditorCommand, CommandContext } from '@/components/Editor/types/EditorCommand'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'

/**
 * 编辑器核心属性
 * 遵循最小接口原则，只暴露必要的配置
 */
export interface EditorCoreProps {
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
    /** AST变化回调 */
    onASTChange?: (ast: DocumentAST) => void
    /** 选择状态变化回调 */
    onSelectionChange?: (selection: Selection) => void
    /** 视图变化回调 */
    onViewChange?: (viewData: any) => void
    /** 错误处理回调 */
    onError?: (error: Error) => void
}

// 注意：在函数定义之后导出默认值，以避免提升引起的声明前使用错误

/**
 * 对外暴露的命令接口（用于 SlashMenu / CommandPalette 动作打通）
 */
export interface EditorCommands {
    // 统一命令调度入口
    runCommand: (commandId: string, payload?: any) => Promise<void> | void
}

/**
 * 编辑器核心组件
 * 负责AST状态管理和适配器协调
 */
const EditorCore = forwardRef<EditorCommands, EditorCoreProps>(function EditorCore({
    className = '',
    style = {},
    initialAST,
    editorType = EditorType.RICH_TEXT,
    sceneTemplate = SceneTemplate.WRITING,
    theme = 'auto',
    // onASTChange, // 初版内核仅内部维护 AST，由上层场景容器统一持久化
    onSelectionChange,
    onViewChange,
    onError,
}: EditorCoreProps, ref) {
    // 状态管理
    const [ast] = useState<DocumentAST>(() => initialAST || createDocumentAST())
    const [selection, setSelection] = useState<Selection>({ 
        nodeIds: [], 
        type: 'node' 
    })
    const [currentAdapter, setCurrentAdapter] = useState<ViewAdapter | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    // 引用管理
    const containerRef = useRef<HTMLDivElement>(null)
    const adapterRef = useRef<ViewAdapter | null>(null)

    // 主题管理
    const { theme: appTheme } = useTheme()
    const effectiveTheme: EditorTheme = useMemo(() => {
        if (theme === 'auto') {
            return appTheme === 'system' ? 'auto' : (appTheme as EditorTheme)
        }
        return theme
    }, [theme, appTheme])

    // 创建适配器
    const createAdapter = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            if (!containerRef.current) {
                throw new Error('Container element not found')
            }

            const adapter = ViewAdapterFactory.createAdapter(editorType, {
                sceneTemplate,
                options: {
                    theme: effectiveTheme,
                },
                onError: (err: Error) => {
                    setError(err)
                    onError?.(err)
                }
            })

            adapterRef.current = adapter
            setCurrentAdapter(adapter)

            // 初始化适配器
            await adapter.create(containerRef.current, {
                type: editorType,
                sceneTemplate,
                theme: effectiveTheme,
            })

            // 设置初始AST
            try {
                adapter.render(ast)
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Failed to render initial AST')
                setError(error)
                onError?.(error)
            }

            // 绑定事件
            adapter.onSelectionChange((newSelection) => {
                try {
                    setSelection(newSelection)
                    onSelectionChange?.(newSelection)
                } catch (err) {
                    console.error('Selection change handler error:', err)
                }
            })

            adapter.onViewChange((viewData) => {
                try {
                    onViewChange?.(viewData)
                } catch (err) {
                    console.error('View change handler error:', err)
                }
            })

            adapter.onError((error) => {
                setError(error)
                onError?.(error)
            })

        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to create adapter')
            setError(error)
            onError?.(error)
        } finally {
            setIsLoading(false)
        }
    }, [editorType, effectiveTheme, sceneTemplate, ast, onSelectionChange, onViewChange, onError])

    // 销毁适配器
    const destroyAdapter = useCallback(async () => {
        if (adapterRef.current) {
            try {
                adapterRef.current.destroy()
            } catch (err) {
                console.error('Error destroying adapter:', err)
            }
            adapterRef.current = null
            setCurrentAdapter(null)
        }
    }, [])

    // 仅保留 Theme 切换，类型切换由上层容器处理

    // 切换主题
    const switchTheme = useCallback(async (_newTheme: EditorTheme) => {
        if (adapterRef.current) {
            try {
                // 重新创建适配器以应用新主题
                await destroyAdapter()
                // 重新创建适配器会在useEffect中触发
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Failed to switch theme')
                setError(error)
                onError?.(error)
            }
        }
    }, [destroyAdapter, onError])

    // 命令注册中心（最小实现：内置一组富文本通用命令）
    const commandRegistry = useRef<EditorCommand[]>([
        {
            id: 'insertParagraph',
            title: '插入段落',
            isSupported: (ctx) => ctx.editorType === EditorType.RICH_TEXT,
            run: (ctx, text = '') => {
                const node = createRichTextNode('paragraph', text)
                ctx.adapter?.addNode(node)
            },
            priority: () => 100,
        },
        {
            id: 'insertHeading',
            title: '插入标题',
            isSupported: (ctx) => ctx.editorType === EditorType.RICH_TEXT,
            run: (ctx, payload: { level?: number; text?: string } = {}) => {
                const level = payload.level ?? 1
                const text = payload.text ?? ''
                const node = createRichTextNode('heading', text, { level })
                ctx.adapter?.addNode(node)
            },
            priority: () => 100,
        },
        {
            id: 'insertQuote',
            title: '插入引用',
            isSupported: (ctx) => ctx.editorType === EditorType.RICH_TEXT,
            run: (ctx, text = '') => {
                const node = createRichTextNode('blockquote', text)
                ctx.adapter?.addNode(node)
            },
            priority: () => 100,
        },
        {
            id: 'insertTable',
            title: '插入表格',
            isSupported: (ctx) => ctx.editorType === EditorType.RICH_TEXT,
            run: (ctx, payload: { rows?: number; cols?: number } = {}) => {
                const rows = payload.rows ?? 2
                const cols = payload.cols ?? 2
                const table = createRichTextNode('table')
                table.children = []
                for (let r = 0; r < rows; r++) {
                    const row = createRichTextNode('tableRow')
                    row.children = []
                    for (let c = 0; c < cols; c++) {
                        row.children.push(createRichTextNode('tableCell', ''))
                    }
                    table.children.push(row)
                }
                ctx.adapter?.addNode(table)
            },
            priority: () => 100,
        },
        {
            id: 'insertLink',
            title: '插入链接',
            isSupported: (ctx) => ctx.editorType === EditorType.RICH_TEXT,
            run: (ctx, payload: { text: string; href: string }) => {
                const link = createRichTextNode('link', payload?.text || '链接', { href: payload?.href || '#' })
                ctx.adapter?.addNode(link)
            },
            priority: () => 100,
        },
    ])

    const getCommandContext = useCallback((): CommandContext => ({
        editorType,
        sceneTemplate,
        selection,
        adapter: adapterRef.current,
        getAST: () => ast,
    }), [editorType, sceneTemplate, selection, ast])

    const runCommand = useCallback(async (commandId: string, payload?: any) => {
        const ctx = getCommandContext()
        const candidates = commandRegistry.current
            .filter(cmd => cmd.id === commandId && cmd.isSupported(ctx))
            .sort((a, b) => (b.priority?.(ctx) || 0) - (a.priority?.(ctx) || 0))
        const command = candidates[0]
        if (!command) return
        await command.run(ctx, payload)
    }, [getCommandContext])

    // 暴露统一命令入口
    useImperativeHandle(ref, (): EditorCommands => ({
        runCommand,
    }), [runCommand])

    // 生命周期管理
    useEffect(() => {
        createAdapter()
        return () => {
            destroyAdapter()
        }
    }, [createAdapter, destroyAdapter])

    // 主题变化处理
    useEffect(() => {
        if (currentAdapter && theme !== 'auto') {
            switchTheme(theme)
        }
    }, [theme, currentAdapter, switchTheme])

    // 错误边界处理
    if (error) {
        return (
            <div className={`editor-container ${className}`} style={style}>
                <div className="flex items-center justify-center h-full p-4">
                    <div className="text-center">
                        <div className="text-destructive text-lg font-medium mb-2">
                            编辑器加载失败
                        </div>
                        <div className="text-muted-foreground text-sm mb-4">
                            {error.message}
                        </div>
                        <Button onClick={() => {
                            setError(null)
                            createAdapter()
                        }}>
                            重试
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div 
            ref={containerRef}
            className={`editor-container ${className}`} 
            style={style}
        >
            {/* 编辑器内容区域 */}
            <div className="editor-content">
                {isLoading && (
                    <div className="absolute inset-0 bg-background flex items-center justify-center z-10">
                        <div className="loading-spinner" />
                    </div>
                )}
                
                {/* 适配器渲染区域 */}
                {currentAdapter && (
                    <div className="w-full h-full">
                        {/* 适配器会在这里渲染其内容 */}
                    </div>
                )}
            </div>

            {/* 状态栏 */}
            <div className="editor-statusbar">
                <div className="flex items-center gap-4 text-xs">
                    <span>选中节点: {selection.nodeIds.length}</span>
                    <span>类型: {selection.type}</span>
                    <span>{editorType}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                        {effectiveTheme}
                    </span>
                </div>
            </div>
        </div>
    )
})

export default EditorCore
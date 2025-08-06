/**
 * 编辑器核心渲染基础组件 - 基于ViewAdapter架构
 * AST作为通信核心，适配器只负责视图渲染
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { ViewAdapter, ViewAdapterOptions } from '@/components/Editor/types/ViewAdapter'
import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'
import { DocumentAST, ASTNode, Selection } from '@/components/Editor/types/EditorAST'
import { EditorTheme } from '@/components/Editor/types/EditorTheme'
import ViewAdapterFactory from '@/components/Editor/core/ViewAdapterFactory'
import { ASTUtils } from '@/components/Editor/utils/ASTUtils'
import './EditorCore.scss'

/**
 * 编辑器核心属性
 */
export interface EditorCoreProps {
    className?: string
    style?: React.CSSProperties
    initialAST?: DocumentAST
    editorType?: EditorType
    sceneTemplate?: SceneTemplate
    theme?: EditorTheme
    onASTChange?: (ast: DocumentAST) => void
    onSelectionChange?: (selection: Selection) => void
    onViewChange?: (viewData: any) => void
}

/**
 * 编辑器核心组件
 */
export const EditorCore: React.FC<EditorCoreProps> = ({
    className = '',
    style = {},
    initialAST,
    editorType = EditorType.RICH_TEXT,
    sceneTemplate = SceneTemplate.WRITING,
    theme = 'auto',
    onASTChange,
    onSelectionChange,
    onViewChange,
}) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const adapterRef = useRef<ViewAdapter | null>(null)
    const [ast, setAST] = useState<DocumentAST>(initialAST || ASTUtils.createDocument('无标题文档'))
    const [selection, setSelection] = useState<Selection>({ nodeIds: [], type: 'node' })
    const [isLoading, setIsLoading] = useState(false)

    // 初始化适配器
    const initializeAdapter = useCallback(async () => {
        if (!containerRef.current) return

        setIsLoading(true)
        try {
            // 创建适配器
            const adapter = ViewAdapterFactory.createAdapter(editorType, sceneTemplate)
            adapterRef.current = adapter

            // 配置适配器选项
            const options: ViewAdapterOptions = {
                type: editorType,
                sceneTemplate,
                theme,
                enableSelection: true,
                enableDrag: true,
                enableResize: true,
                enableContextMenu: true,
            }

            // 初始化适配器
            await adapter.create(containerRef.current, options)

            // 渲染初始AST
            adapter.render(ast)

            // 设置事件监听
            adapter.onSelectionChange((newSelection: Selection) => {
                setSelection(newSelection)
                onSelectionChange?.(newSelection)
            })

            adapter.onViewChange((viewData: any) => {
                onViewChange?.(viewData)
            })

            adapter.onNodeClick((nodeId: string, event: MouseEvent) => {
                console.log('Node clicked:', nodeId, event)
            })

            adapter.onNodeDoubleClick((nodeId: string, event: MouseEvent) => {
                console.log('Node double clicked:', nodeId, event)
            })

        } catch (error) {
            console.error('Failed to initialize adapter:', error)
        } finally {
            setIsLoading(false)
        }
    }, [editorType, sceneTemplate, theme, ast, onSelectionChange, onViewChange])

    // 切换适配器
    const switchAdapter = useCallback(async (newType: EditorType, newTemplate: SceneTemplate) => {
        if (!containerRef.current) return

        setIsLoading(true)
        try {
            // 销毁当前适配器
            if (adapterRef.current) {
                adapterRef.current.destroy()
                adapterRef.current = null
            }

            // 创建新适配器
            const adapter = ViewAdapterFactory.createAdapter(newType, newTemplate)
            adapterRef.current = adapter

            // 配置新适配器
            const options: ViewAdapterOptions = {
                type: newType,
                sceneTemplate: newTemplate,
                theme,
                enableSelection: true,
                enableDrag: true,
                enableResize: true,
                enableContextMenu: true,
            }

            // 初始化新适配器
            await adapter.create(containerRef.current, options)

            // 渲染AST
            adapter.render(ast)

            // 重新设置事件监听
            adapter.onSelectionChange((newSelection: Selection) => {
                setSelection(newSelection)
                onSelectionChange?.(newSelection)
            })

            adapter.onViewChange((viewData: any) => {
                onViewChange?.(viewData)
            })

        } catch (error) {
            console.error('Failed to switch adapter:', error)
        } finally {
            setIsLoading(false)
        }
    }, [theme, ast, onSelectionChange, onViewChange])

    // 更新AST
    const updateAST = useCallback((newAST: DocumentAST) => {
        setAST(newAST)
        adapterRef.current?.render(newAST)
        onASTChange?.(newAST)
    }, [onASTChange])

    // 添加节点
    const addNode = useCallback((node: ASTNode, parentId?: string, index?: number) => {
        const newAST = { ...ast }
        // TODO: 实现节点添加逻辑
        updateAST(newAST)
    }, [ast, updateAST])

    // 删除节点
    const removeNode = useCallback((nodeId: string) => {
        const newAST = { ...ast }
        // TODO: 实现节点删除逻辑
        updateAST(newAST)
    }, [ast, updateAST])

    // 更新节点
    const updateNode = useCallback((nodeId: string, updates: Partial<ASTNode>) => {
        const newAST = { ...ast }
        // TODO: 实现节点更新逻辑
        updateAST(newAST)
    }, [ast, updateAST])

    // 初始化
    useEffect(() => {
        initializeAdapter()
    }, [initializeAdapter])

    // 清理
    useEffect(() => {
        return () => {
            if (adapterRef.current) {
                adapterRef.current.destroy()
                adapterRef.current = null
            }
        }
    }, [])

    return (
        <div className={`editor-core ${className}`} style={style}>
            {/* 加载状态 */}
            {isLoading && (
                <div className="editor-loading">
                    <div className="loading-spinner" />
                    <span>加载中...</span>
                </div>
            )}
            
            {/* 编辑器容器 */}
            <div 
                ref={containerRef}
                className="editor-container"
                style={{ display: isLoading ? 'none' : 'block' }}
            />
        </div>
    )
} 
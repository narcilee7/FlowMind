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

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import styled from 'styled-components'
import { ViewAdapter } from '@/components/Editor/types/ViewAdapter'
import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'
import { DocumentAST, Selection } from '@/components/Editor/types/EditorAST'
import { EditorTheme } from '@/components/Editor/types/EditorTheme'
import ViewAdapterFactory from '@/components/Editor/core/ViewAdapterFactory'
import { createDocumentAST } from '@/components/Editor/utils/ASTUtils'
import { useTheme } from '@/hooks/useAppState'

// 样式组件 - 保持简洁，专注于布局
const EditorContainer = styled.div`
  width: 100%;
  height: 100%;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

const EditorContent = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--background);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`

const LoadingSpinner = styled.div`
  width: 2rem;
  height: 2rem;
  border: 2px solid var(--border);
  border-top: 2px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

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

/**
 * 编辑器核心组件
 * 
 * 设计模式：
 * - 组合模式：通过props组合不同功能
 * - 观察者模式：通过回调函数通知状态变化
 * - 策略模式：通过editorType切换不同适配器
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
    onError,
}) => {
    // ==================== 状态管理 ====================
    
    /** 容器引用 - 用于适配器挂载 */
    const containerRef = useRef<HTMLDivElement>(null)
    /** 适配器引用 - 当前活动的视图适配器 */
    const adapterRef = useRef<ViewAdapter | null>(null)
    /** AST状态 - 文档的核心数据结构 */
    const [ast, setAST] = useState<DocumentAST>(initialAST || createDocumentAST('无标题文档'))
    /** 选择状态 - 当前选中的节点或文本范围 */
    const [selection, setSelection] = useState<Selection>({ nodeIds: [], type: 'node' })
    /** 加载状态 - 适配器初始化状态 */
    const [isLoading, setIsLoading] = useState(false)
    
    // ==================== 主题管理 ====================
    
    /** 使用主题系统 */
    const { currentTheme, setEditorTheme } = useTheme()
    /** 有效主题 - 自动模式时使用系统主题 */
    const effectiveTheme: EditorTheme = useMemo(() => 
        theme === 'auto' ? (currentTheme.type as EditorTheme) : theme, 
        [theme, currentTheme.type]
    )

    // ==================== 适配器管理 ====================
    
    /**
     * 初始化适配器
     * 职责：创建、配置、挂载视图适配器
     */
    const initializeAdapter = useCallback(async () => {
        if (!containerRef.current) return

        setIsLoading(true)
        try {
            // 1. 创建适配器实例
            const adapter = ViewAdapterFactory.createAdapter(editorType, {
                sceneTemplate,
                options: {
                    type: editorType,
                    sceneTemplate,
                    theme: effectiveTheme,
                    enableSelection: true,
                    enableDrag: true,
                    enableResize: true,
                    enableContextMenu: true,
                },
                onError: (error) => {
                    console.error('Adapter error:', error)
                    onError?.(error)
                }
            })
            adapterRef.current = adapter

            // 2. 初始化适配器
            await adapter.create(containerRef.current, {
                type: editorType,
                sceneTemplate,
                theme: effectiveTheme,
                enableSelection: true,
                enableDrag: true,
                enableResize: true,
                enableContextMenu: true,
            })

            // 3. 渲染初始AST
            adapter.render(ast)

            // 4. 设置事件监听
            setupAdapterEvents(adapter)

        } catch (error) {
            console.error('Failed to initialize adapter:', error)
            onError?.(error as Error)
        } finally {
            setIsLoading(false)
        }
    }, [editorType, sceneTemplate, effectiveTheme, ast, onError])

    /**
     * 设置适配器事件监听
     * 职责：统一管理适配器事件，避免重复代码
     */
    const setupAdapterEvents = useCallback((adapter: ViewAdapter) => {
        // 选择状态变化
        adapter.onSelectionChange((newSelection: Selection) => {
            setSelection(newSelection)
            onSelectionChange?.(newSelection)
        })

        // 视图变化
        adapter.onViewChange((viewData: any) => {
            onViewChange?.(viewData)
        })

        // 节点交互
        adapter.onNodeClick(({ nodeId, event }) => {
            console.log('Node clicked:', nodeId, event)
        })

        adapter.onNodeDoubleClick(({ nodeId, event }) => {
            console.log('Node double clicked:', nodeId, event)
        })

        // 焦点管理
        adapter.onFocus(() => {
            console.log('Editor focused')
        })

        adapter.onBlur(() => {
            console.log('Editor blurred')
        })
    }, [onSelectionChange, onViewChange])

    // ==================== AST管理 ====================
    
    /**
     * 更新AST
     * 职责：同步AST状态到适配器
     */
    const updateAST = useCallback((newAST: DocumentAST) => {
        setAST(newAST)
        if (adapterRef.current) {
            adapterRef.current.update(newAST)
        }
        onASTChange?.(newAST)
    }, [onASTChange])

    /**
     * 设置选择状态
     * 职责：同步选择状态到适配器
     */
    const setSelectionState = useCallback((newSelection: Selection) => {
        setSelection(newSelection)
        if (adapterRef.current) {
            adapterRef.current.setSelection(newSelection)
        }
    }, [onASTChange])

    // ==================== 生命周期管理 ====================
    
    /** 初始化 - 组件挂载时创建适配器 */
    useEffect(() => {
        initializeAdapter()
    }, [initializeAdapter])

    /** 清理 - 组件卸载时销毁适配器 */
    useEffect(() => {
        return () => {
            if (adapterRef.current) {
                adapterRef.current.destroy()
            }
        }
    }, [])

    /** 主题变化时重新初始化适配器 */
    useEffect(() => {
        if (adapterRef.current) {
            initializeAdapter()
        }
    }, [effectiveTheme, initializeAdapter])

    return (
        <EditorContainer className={className} style={style}>
            <EditorContent>
                <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
                {isLoading && (
                    <LoadingOverlay>
                        <LoadingSpinner />
                    </LoadingOverlay>
                )}
            </EditorContent>
        </EditorContainer>
    )
}

export default EditorCore 
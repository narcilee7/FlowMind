/**
 * 编辑器核心渲染基础组件 - 基于ViewAdapter架构
 * AST作为通信核心，适配器只负责视图渲染
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import styled from 'styled-components'
import { ViewAdapter } from '@/components/Editor/types/ViewAdapter'
import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'
import { DocumentAST, Selection } from '@/components/Editor/types/EditorAST'
import { EditorTheme } from '@/components/Editor/types/EditorTheme'
import ViewAdapterFactory from '@/components/Editor/core/ViewAdapterFactory'
import { createDocumentAST } from '@/components/Editor/utils/ASTUtils'
import { useTheme } from '@/hooks/useAppState'

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
    const [ast, setAST] = useState<DocumentAST>(initialAST || createDocumentAST('无标题文档'))
    const [selection, setSelection] = useState<Selection>({ nodeIds: [], type: 'node' })
    const [isLoading, setIsLoading] = useState(false)
    
    // 使用主题系统
    const { currentTheme, setEditorTheme } = useTheme()
    const effectiveTheme: EditorTheme = theme === 'auto' ? (currentTheme.type as EditorTheme) : theme

    // 初始化适配器
    const initializeAdapter = useCallback(async () => {
        if (!containerRef.current) return

        setIsLoading(true)
        try {
            // 创建适配器
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
                }
            })
            adapterRef.current = adapter

            // 初始化适配器
            await adapter.create(containerRef.current, {
                type: editorType,
                sceneTemplate,
                theme: effectiveTheme,
                enableSelection: true,
                enableDrag: true,
                enableResize: true,
                enableContextMenu: true,
            })

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

            adapter.onNodeClick(({ nodeId, event }) => {
                console.log('Node clicked:', nodeId, event)
            })

            adapter.onNodeDoubleClick(({ nodeId, event }) => {
                console.log('Node double clicked:', nodeId, event)
            })

        } catch (error) {
            console.error('Failed to initialize adapter:', error)
        } finally {
            setIsLoading(false)
        }
    }, [editorType, sceneTemplate, effectiveTheme, ast, onSelectionChange, onViewChange])

    // 更新AST
    const updateAST = useCallback((newAST: DocumentAST) => {
        setAST(newAST)
        if (adapterRef.current) {
            adapterRef.current.update(newAST)
        }
        onASTChange?.(newAST)
    }, [onASTChange])

    // 设置选择
    const setSelectionState = useCallback((newSelection: Selection) => {
        setSelection(newSelection)
        if (adapterRef.current) {
            adapterRef.current.setSelection(newSelection)
        }
    }, [])

    // 初始化
    useEffect(() => {
        initializeAdapter()
    }, [initializeAdapter])

    // 清理
    useEffect(() => {
        return () => {
            if (adapterRef.current) {
                adapterRef.current.destroy()
            }
        }
    }, [])

    // 主题变化时重新初始化
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
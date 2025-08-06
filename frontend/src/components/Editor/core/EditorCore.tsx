/**
 * 编辑器核心组件 - 重构版
 * 基于Adapter Factory + 插件模式的清爽架构
 */

import React, { useEffect, useRef, useCallback, useState } from 'react'
import { useEditor } from '../types/EditorContext'
import { EditorType, SceneTemplate } from '../types/EditorType'
import { EditorCore as EditorCoreType } from '../types/EditorCore'
import { EditorAdapter } from '../types/EditorAdapter'
import EditorAdapterFactory from './EditorAdapterFactory'
import EditorPluginManager from './EditorPluginManager'
import './EditorCore.scss'

/**
 * 编辑器核心组件属性
 */
export interface EditorCoreProps {
    className?: string
    style?: React.CSSProperties
    initialContent?: string
    onContentChange?: (content: string) => void
    onEditorTypeChange?: (type: EditorType) => void
    onSceneTemplateChange?: (template: SceneTemplate) => void
}

/**
 * 编辑器核心组件
 */
export const EditorCore: React.FC<EditorCoreProps> = ({
    className = '',
    style = {},
    initialContent = '',
    onContentChange,
    onEditorTypeChange,
    onSceneTemplateChange,
}) => {
    const {
        state,
        config,
        setContent,
        setEditorType,
        setSceneTemplate,
    } = useEditor()

    const editorRef = useRef<HTMLDivElement>(null)
    const coreRef = useRef<EditorCoreType | null>(null)
    const pluginManagerRef = useRef<EditorPluginManager | null>(null)

    // 初始化编辑器核心
    useEffect(() => {
        if (!editorRef.current) return

        // 创建编辑器核心实例
        coreRef.current = new EditorCoreType()
        
        // 创建插件管理器
        pluginManagerRef.current = new EditorPluginManager(coreRef.current)
        
        const initEditor = async () => {
            try {
                // 创建适配器
                const adapter = EditorAdapterFactory.createAdapter(
                    state.editorType,
                    state.sceneTemplate
                )

                // 初始化编辑器核心
                await coreRef.current!.init(editorRef.current!, adapter, {
                    content: initialContent || state.content,
                    autoSave: config.autoSave,
                    autoSaveInterval: config.autoSaveInterval,
                    enableAI: config.enableAI,
                    theme: config.theme,
                    fontSize: config.fontSize,
                })

                // 初始化插件
                await pluginManagerRef.current!.init()

                // 设置事件监听
                coreRef.current!.on('content:change', (content: string) => {
                    setContent(content)
                    onContentChange?.(content)
                })

                coreRef.current!.on('type:change', (type: EditorType) => {
                    setEditorType(type)
                    onEditorTypeChange?.(type)
                })

                coreRef.current!.on('template:change', (template: SceneTemplate) => {
                    setSceneTemplate(template)
                    onSceneTemplateChange?.(template)
                })

            } catch (error) {
                console.error('Failed to initialize editor:', error)
            }
        }

        initEditor()

        return () => {
            pluginManagerRef.current?.destroy()
            coreRef.current?.destroy()
        }
    }, []) // 只在组件挂载时初始化

    // 编辑器类型变化时切换适配器
    useEffect(() => {
        if (!coreRef.current) return

        const switchAdapter = async () => {
            try {
                await coreRef.current!.switchAdapter(state.editorType, state.sceneTemplate)
            } catch (error) {
                console.error('Failed to switch adapter:', error)
            }
        }

        switchAdapter()
    }, [state.editorType, state.sceneTemplate])

    // 内容变化时更新编辑器
    useEffect(() => {
        if (!coreRef.current) return

        const currentContent = coreRef.current.getContent()
        if (currentContent !== state.content) {
            coreRef.current.setContent(state.content)
        }
    }, [state.content])

    return (
        <div className={`editor-core ${className}`} style={style}>
            {/* 主编辑区域 */}
            <div className="editor-main">
                {/* 编辑器容器 */}
                <div className="editor-content">
                    <div
                        ref={editorRef}
                        className="editor-container"
                        style={{
                            fontSize: config.fontSize,
                        }}
                    />
                    
                    {/* 空状态提示 */}
                    {!state.content && (
                        <div className="editor-empty-state">
                            <div className="empty-state-content">
                                <h2>开始创作</h2>
                                <p>输入 / 插入内容，或使用 ⌘K 打开命令面板</p>
                                <button 
                                    className="new-document-btn"
                                    onClick={() => {
                                        coreRef.current?.focus()
                                    }}
                                >
                                    开始写作
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
} 
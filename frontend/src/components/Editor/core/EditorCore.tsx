/**
 * 编辑器核心组件
 */

import React, { useEffect, useRef, useCallback } from 'react'
import { useEditor } from '../types/editorContext'
import { EditorType, SceneTemplate } from '../types/editorType'
import EditorManager from './EditorManager'

/**
 * 编辑器核心组件属性
 */
export interface EditorCoreProps {
    className?: string
    style?: React.CSSProperties
    showToolbar?: boolean
    showSidebar?: boolean
    showTOC?: boolean
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
    showToolbar = true,
    showSidebar = true,
    showTOC = true,
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
        updateTOC,
        generateTOC,
        navigateToSection,
    } = useEditor()

    const editorRef = useRef<HTMLDivElement>(null)
    const managerRef = useRef<EditorManager | null>(null)

    // 初始化编辑器管理器
    useEffect(() => {
        if (!editorRef.current) return

        managerRef.current = new EditorManager()
        
        const initEditor = async () => {
            try {
                await managerRef.current?.createEditor(
                    editorRef.current!,
                    state.editorType,
                    state.sceneTemplate,
                    {
                        content: state.content,
                        autoSave: config.autoSave,
                        autoSaveInterval: config.autoSaveInterval,
                        enableAI: config.enableAI,
                        autoGenerateTOC: config.autoGenerateTOC,
                        tocUpdateInterval: config.tocUpdateInterval,
                        theme: config.theme,
                        fontSize: config.fontSize,
                    }
                )

                // 设置事件监听
                const adapter = managerRef.current?.getCurrentAdapter()
                if (adapter) {
                    adapter.onContentChange((content: string) => {
                        setContent(content)
                        onContentChange?.(content)
                    })

                    adapter.onTOCChange((toc: any[]) => {
                        updateTOC()
                    })
                }

                // 生成初始TOC
                if (config.autoGenerateTOC) {
                    const toc = generateTOC()
                    if (toc.length > 0) {
                        updateTOC()
                    }
                }
            } catch (error) {
                console.error('Failed to initialize editor:', error)
            }
        }

        initEditor()

        return () => {
            managerRef.current?.destroyEditor()
        }
    }, []) // 只在组件挂载时初始化

    // 编辑器类型变化时重新创建编辑器
    useEffect(() => {
        if (!managerRef.current || !editorRef.current) return

        const switchEditor = async () => {
            try {
                await managerRef.current?.switchEditorType(state.editorType)
                onEditorTypeChange?.(state.editorType)
            } catch (error) {
                console.error('Failed to switch editor type:', error)
            }
        }

        switchEditor()
    }, [state.editorType, onEditorTypeChange])

    // 场景模板变化时重新创建编辑器
    useEffect(() => {
        if (!managerRef.current || !editorRef.current) return

        const switchTemplate = async () => {
            try {
                await managerRef.current?.switchSceneTemplate(state.sceneTemplate)
                onSceneTemplateChange?.(state.sceneTemplate)
            } catch (error) {
                console.error('Failed to switch scene template:', error)
            }
        }

        switchTemplate()
    }, [state.sceneTemplate, onSceneTemplateChange])

    // 内容变化时更新编辑器
    useEffect(() => {
        if (!managerRef.current) return

        const currentContent = managerRef.current.getContent()
        if (currentContent !== state.content) {
            managerRef.current.setContent(state.content)
        }
    }, [state.content])

    // 处理章节导航
    const handleSectionClick = useCallback((sectionId: string) => {
        navigateToSection(sectionId)
    }, [navigateToSection])

    // 渲染目录
    const renderTOC = () => {
        if (!showTOC || !state.tocVisible) return null

        return (
            <div className="editor-toc">
                <h3>目录</h3>
                <ul>
                    {state.tableOfContents.map((item) => (
                        <li
                            key={item.id}
                            className={`toc-item level-${item.level} ${
                                item.id === state.currentSection ? 'active' : ''
                            }`}
                            onClick={() => handleSectionClick(item.id)}
                        >
                            {item.title}
                        </li>
                    ))}
                </ul>
            </div>
        )
    }

    // 渲染工具栏
    const renderToolbar = () => {
        if (!showToolbar || !state.toolbarVisible) return null

        return (
            <div className="editor-toolbar">
                <div className="toolbar-left">
                    <select
                        value={state.editorType}
                        onChange={(e) => setEditorType(e.target.value as EditorType)}
                    >
                        <option value={EditorType.RICH_TEXT}>富文本</option>
                        <option value={EditorType.GRAPH}>知识图谱</option>
                        <option value={EditorType.CANVAS}>Canvas</option>
                        <option value={EditorType.TABLE}>表格</option>
                        <option value={EditorType.TIMELINE}>时间线</option>
                    </select>

                    <select
                        value={state.sceneTemplate}
                        onChange={(e) => setSceneTemplate(e.target.value as SceneTemplate)}
                    >
                        <option value={SceneTemplate.WRITING}>写作</option>
                        <option value={SceneTemplate.RESEARCH}>研究</option>
                        <option value={SceneTemplate.LEARNING}>学习</option>
                        <option value={SceneTemplate.PLANNING}>规划</option>
                        <option value={SceneTemplate.CREATIVE}>创意</option>
                    </select>
                </div>

                <div className="toolbar-right">
                    <button onClick={() => updateTOC()}>更新目录</button>
                    {state.isAIProcessing && <span>AI处理中...</span>}
                </div>
            </div>
        )
    }

    // 渲染侧边栏
    const renderSidebar = () => {
        if (!showSidebar || !state.sidebarVisible) return null

        return (
            <div className="editor-sidebar">
                <div className="sidebar-section">
                    <h3>AI建议</h3>
                    {state.aiSuggestions.length > 0 ? (
                        <ul>
                            {state.aiSuggestions.map((suggestion) => (
                                <li key={suggestion.id}>
                                    <strong>{suggestion.title}</strong>
                                    <p>{suggestion.description}</p>
                                    <button onClick={suggestion.action}>
                                        应用建议
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>暂无AI建议</p>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className={`editor-core ${className}`} style={style}>
            {renderToolbar()}
            
            <div className="editor-main">
                {renderSidebar()}
                
                <div className="editor-content">
                    <div
                        ref={editorRef}
                        className="editor-container"
                        style={{
                            fontSize: config.fontSize,
                        }}
                    />
                </div>
                
                {renderTOC()}
            </div>
        </div>
    )
} 
/**
 * 编辑器演示组件 - 基于PRD重构
 */

import React, { useState } from 'react'
import { EditorProvider, EditorCore, EditorType, SceneTemplate } from '../index'
import './EditorDemo.scss'

/**
 * 编辑器演示组件
 */
export const EditorDemo: React.FC = () => {
    const [content, setContent] = useState('')
    const [editorType, setEditorType] = useState<EditorType>(EditorType.RICH_TEXT)
    const [sceneTemplate, setSceneTemplate] = useState<SceneTemplate>(SceneTemplate.WRITING)

    const handleContentChange = (newContent: string) => {
        setContent(newContent)
        console.log('Content changed:', newContent)
    }

    const handleEditorTypeChange = (type: EditorType) => {
        setEditorType(type)
        console.log('Editor type changed:', type)
    }

    const handleSceneTemplateChange = (template: SceneTemplate) => {
        setSceneTemplate(template)
        console.log('Scene template changed:', template)
    }

    return (
        <div className="editor-demo">
            <h1>AI Native Editor 演示</h1>
            <p>当前编辑器类型: {editorType}</p>
            <p>当前场景模板: {sceneTemplate}</p>
            
            <EditorProvider
                initialContent={content}
                initialEditorType={editorType}
                initialSceneTemplate={sceneTemplate}
                onStateChange={(state) => {
                    console.log('State changed:', state)
                }}
                onTOCChange={(toc) => {
                    console.log('TOC changed:', toc)
                }}
                onAISuggestionChange={(suggestions) => {
                    console.log('AI suggestions changed:', suggestions)
                }}
            >
                <EditorCore
                    showToolbar={true}
                    showSidebar={true}
                    showTOC={true}
                    onContentChange={handleContentChange}
                    onEditorTypeChange={handleEditorTypeChange}
                    onSceneTemplateChange={handleSceneTemplateChange}
                />
            </EditorProvider>
        </div>
    )
} 
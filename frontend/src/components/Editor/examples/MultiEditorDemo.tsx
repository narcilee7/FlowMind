import React, { useState } from 'react'
import { EditorProvider, EditorType, EditorMode } from '../core/EditorProvider'
import { EditorCoreV2 } from '../organisms/EditorCoreV2'

export const MultiEditorDemo: React.FC = () => {
  const [currentContent, setCurrentContent] = useState('# 欢迎使用 FlowMind 编辑器\n\n这是一个支持多种编辑器类型的知识管理编辑器。')
  const [currentEditorType, setCurrentEditorType] = useState<EditorType>(EditorType.MARKDOWN)
  const [currentEditorMode, setCurrentEditorMode] = useState<EditorMode>(EditorMode.EDIT)

  const handleContentChange = (content: string) => {
    setCurrentContent(content)
    console.log('Content changed:', content.length, 'characters')
  }

  const handleEditorTypeChange = (type: EditorType) => {
    setCurrentEditorType(type)
    console.log('Editor type changed to:', type)
  }

  const handleEditorModeChange = (mode: EditorMode) => {
    setCurrentEditorMode(mode)
    console.log('Editor mode changed to:', mode)
  }

  const getEditorDescription = (type: EditorType): string => {
    switch (type) {
      case EditorType.MARKDOWN:
        return '支持标准Markdown语法，提供实时预览和所见即所得编辑体验，类似Typora。'
      case EditorType.RICH_TEXT:
        return '块级富文本编辑器，支持多种内容块类型，类似Notion的编辑体验。'
      case EditorType.CANVAS:
        return '图形化编辑器，支持节点和连接线，适合思维导图和知识图谱，类似Obsidian Canvas。'
      default:
        return ''
    }
  }

  return (
    <div className="multi-editor-demo">
      <div className="demo-header">
        <h1>FlowMind 多编辑器演示</h1>
        <p className="demo-description">
          当前编辑器类型：<strong>{currentEditorType}</strong>
          {currentEditorType === EditorType.MARKDOWN && (
            <> | 模式：<strong>{currentEditorMode}</strong></>
          )}
        </p>
        <p className="editor-description">
          {getEditorDescription(currentEditorType)}
        </p>
      </div>

      <div className="demo-content">
        <EditorProvider
          initialContent={currentContent}
          initialEditorType={currentEditorType}
          initialEditorMode={currentEditorMode}
        >
          <EditorCoreV2
            className="demo-editor"
            showToolbar={true}
            showStatusBar={true}
            onContentChange={handleContentChange}
            onEditorTypeChange={handleEditorTypeChange}
            onEditorModeChange={handleEditorModeChange}
          />
        </EditorProvider>
      </div>

      <div className="demo-info">
        <h3>功能特性</h3>
        <ul>
          <li><strong>Markdown编辑器</strong>：支持语法高亮、实时预览、数学公式、Mermaid图表</li>
          <li><strong>富文本编辑器</strong>：块级编辑、拖拽排序、协作编辑</li>
          <li><strong>Canvas编辑器</strong>：节点连接、缩放平移、网格对齐</li>
          <li><strong>统一架构</strong>：三种编辑器共享状态管理和插件系统</li>
          <li><strong>无缝切换</strong>：支持编辑器类型间的实时切换</li>
        </ul>

        <h3>技术架构</h3>
        <ul>
          <li><strong>适配器模式</strong>：每种编辑器类型都有独立的适配器实现</li>
          <li><strong>插件系统</strong>：支持功能扩展和自定义</li>
          <li><strong>状态管理</strong>：统一的状态管理和事件系统</li>
          <li><strong>类型安全</strong>：完整的TypeScript类型定义</li>
        </ul>
      </div>

      <style jsx>{`
        .multi-editor-demo {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg-color, #f5f5f5);
        }

        .demo-header {
          padding: 20px;
          background: var(--header-bg, #ffffff);
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }

        .demo-header h1 {
          margin: 0 0 10px 0;
          color: var(--text-primary, #333333);
          font-size: 24px;
          font-weight: 600;
        }

        .demo-description {
          margin: 0 0 8px 0;
          color: var(--text-secondary, #666666);
          font-size: 14px;
        }

        .editor-description {
          margin: 0;
          color: var(--text-secondary, #666666);
          font-size: 14px;
          line-height: 1.5;
        }

        .demo-content {
          flex: 1;
          padding: 20px;
          overflow: hidden;
        }

        .demo-editor {
          height: 100%;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .demo-info {
          padding: 20px;
          background: var(--info-bg, #ffffff);
          border-top: 1px solid var(--border-color, #e0e0e0);
          max-height: 200px;
          overflow-y: auto;
        }

        .demo-info h3 {
          margin: 0 0 10px 0;
          color: var(--text-primary, #333333);
          font-size: 16px;
          font-weight: 600;
        }

        .demo-info ul {
          margin: 0 0 20px 0;
          padding-left: 20px;
          color: var(--text-secondary, #666666);
          font-size: 14px;
          line-height: 1.6;
        }

        .demo-info li {
          margin-bottom: 4px;
        }

        .demo-info strong {
          color: var(--text-primary, #333333);
        }
      `}</style>
    </div>
  )
} 
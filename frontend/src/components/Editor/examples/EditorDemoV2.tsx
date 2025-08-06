/**
 * Editor 演示页面 V2 - 展示重构后的功能
 */

import React, { useState } from 'react'
import { EditorCore } from '../core/EditorCore'
import { EditorType, SceneTemplate } from '../types/EditorType'
import './EditorDemoV2.scss'

/**
 * Editor 演示页面 V2
 */
export const EditorDemoV2: React.FC = () => {
    const [currentContent, setCurrentContent] = useState('')
    const [currentMode, setCurrentMode] = useState<EditorType>(EditorType.RICH_TEXT)
    const [currentTemplate, setCurrentTemplate] = useState<SceneTemplate>(SceneTemplate.WRITING)

    // 处理内容变化
    const handleContentChange = (content: string) => {
        setCurrentContent(content)
        console.log('Content changed:', content)
    }

    // 处理编辑器类型变化
    const handleEditorTypeChange = (type: EditorType) => {
        setCurrentMode(type)
        console.log('Editor type changed:', type)
    }

    // 处理场景模板变化
    const handleSceneTemplateChange = (template: SceneTemplate) => {
        setCurrentTemplate(template)
        console.log('Scene template changed:', template)
    }

    return (
        <div className="editor-demo-v2">
            {/* 演示说明 */}
            <div className="demo-header">
                <h1>AI Native Editor - 重构演示</h1>
                <p>基于PRD重构的极简设计，渐进暴露功能，上下文驱动的交互模式</p>
                
                <div className="demo-features">
                    <div className="feature-item">
                        <span className="feature-icon">🎯</span>
                        <span className="feature-text">极简设计</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">🚀</span>
                        <span className="feature-text">渐进暴露</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">🤖</span>
                        <span className="feature-text">AI驱动</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">⌨️</span>
                        <span className="feature-text">快捷键</span>
                    </div>
                </div>
            </div>

            {/* 编辑器容器 */}
            <div className="editor-container">
                <EditorCore
                    initialContent={currentContent}
                    onContentChange={handleContentChange}
                    onEditorTypeChange={handleEditorTypeChange}
                    onSceneTemplateChange={handleSceneTemplateChange}
                />
            </div>

            {/* 功能说明 */}
            <div className="demo-instructions">
                <h2>使用说明</h2>
                
                <div className="instruction-section">
                    <h3>🎯 极简设计</h3>
                    <ul>
                        <li>首次进入只显示空白编辑区和"新建文档"按钮</li>
                        <li>所有功能通过上下文和快捷键触发</li>
                        <li>无干扰的沉浸式编辑体验</li>
                    </ul>
                </div>

                <div className="instruction-section">
                    <h3>⌨️ 快捷键</h3>
                    <ul>
                        <li><code>⌘K</code> / <code>Ctrl+K</code> - 打开命令面板</li>
                        <li><code>/</code> - 打开插入菜单</li>
                        <li><code>⌘B</code> / <code>Ctrl+B</code> - 加粗</li>
                        <li><code>⌘I</code> / <code>Ctrl+I</code> - 斜体</li>
                        <li><code>⌘S</code> / <code>Ctrl+S</code> - 保存</li>
                    </ul>
                </div>

                <div className="instruction-section">
                    <h3>🤖 AI功能</h3>
                    <ul>
                        <li>选中文本自动显示浮动工具栏</li>
                        <li>AI改写、扩展、摘要、翻译</li>
                        <li>右侧AI面板提供详细建议</li>
                        <li>支持多轮AI交互</li>
                    </ul>
                </div>

                <div className="instruction-section">
                    <h3>🚀 渐进暴露</h3>
                    <ul>
                        <li>新用户只看到基础功能</li>
                        <li>使用过程中逐步解锁高级功能</li>
                        <li>上下文驱动的功能提示</li>
                        <li>可自定义功能暴露策略</li>
                    </ul>
                </div>

                <div className="instruction-section">
                    <h3>🎨 多形态编辑</h3>
                    <ul>
                        <li>富文本编辑器（当前模式）</li>
                        <li>知识图谱编辑器</li>
                        <li>Canvas白板</li>
                        <li>表格/数据库视图</li>
                        <li>时间线/卡片视图</li>
                    </ul>
                </div>
            </div>

            {/* 当前状态 */}
            <div className="demo-status">
                <h3>当前状态</h3>
                <div className="status-grid">
                    <div className="status-item">
                        <span className="status-label">编辑模式:</span>
                        <span className="status-value">{currentMode}</span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">场景模板:</span>
                        <span className="status-value">{currentTemplate}</span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">内容长度:</span>
                        <span className="status-value">{currentContent.length} 字符</span>
                    </div>
                </div>
            </div>
        </div>
    )
} 
/**
 * 浮动工具栏组件 - 文本选中时显示
 * 提供格式化工具和AI功能
 */

import React, { useEffect, useRef } from 'react'
import './FloatingToolbar.scss'

/**
 * 浮动工具栏属性
 */
export interface FloatingToolbarProps {
    position: { x: number; y: number }
    selectedText: string
    onAIAction: () => void
    onClose: () => void
}

/**
 * 浮动工具栏组件
 */
export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
    position,
    selectedText,
    onAIAction,
    onClose,
}) => {
    const toolbarRef = useRef<HTMLDivElement>(null)

    // 计算工具栏位置
    const toolbarStyle = {
        left: Math.min(position.x, window.innerWidth - 300),
        top: Math.max(position.y, 10),
    }

    // 点击外部关闭工具栏
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
                onClose()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [onClose])

    // 处理格式化操作
    const handleFormat = (format: string) => {
        console.log(`应用格式: ${format}`)
        // 这里应该调用编辑器的格式化API
        onClose()
    }

    // 处理AI操作
    const handleAIAction = (action: string) => {
        console.log(`AI操作: ${action}`)
        onAIAction()
        onClose()
    }

    return (
        <div className="floating-toolbar-overlay">
            <div 
                ref={toolbarRef}
                className="floating-toolbar"
                style={toolbarStyle}
            >
                {/* 格式化工具 */}
                <div className="toolbar-section">
                    <div className="section-title">格式化</div>
                    <div className="toolbar-buttons">
                        <button 
                            className="toolbar-btn"
                            onClick={() => handleFormat('bold')}
                            title="加粗 (Ctrl+B)"
                        >
                            <strong>B</strong>
                        </button>
                        <button 
                            className="toolbar-btn"
                            onClick={() => handleFormat('italic')}
                            title="斜体 (Ctrl+I)"
                        >
                            <em>I</em>
                        </button>
                        <button 
                            className="toolbar-btn"
                            onClick={() => handleFormat('underline')}
                            title="下划线 (Ctrl+U)"
                        >
                            <u>U</u>
                        </button>
                        <div className="toolbar-divider"></div>
                        <button 
                            className="toolbar-btn"
                            onClick={() => handleFormat('link')}
                            title="插入链接"
                        >
                            🔗
                        </button>
                        <button 
                            className="toolbar-btn"
                            onClick={() => handleFormat('code')}
                            title="代码格式"
                        >
                            {'</>'}
                        </button>
                    </div>
                </div>

                {/* AI功能 */}
                <div className="toolbar-section">
                    <div className="section-title">AI助手</div>
                    <div className="toolbar-buttons">
                        <button 
                            className="toolbar-btn ai-btn"
                            onClick={() => handleAIAction('rewrite')}
                            title="AI改写"
                        >
                            ✏️ 改写
                        </button>
                        <button 
                            className="toolbar-btn ai-btn"
                            onClick={() => handleAIAction('expand')}
                            title="AI扩展"
                        >
                            📝 扩展
                        </button>
                        <button 
                            className="toolbar-btn ai-btn"
                            onClick={() => handleAIAction('summarize')}
                            title="AI摘要"
                        >
                            📋 摘要
                        </button>
                        <button 
                            className="toolbar-btn ai-btn"
                            onClick={() => handleAIAction('translate')}
                            title="AI翻译"
                        >
                            🌐 翻译
                        </button>
                    </div>
                </div>

                {/* 选中文本预览 */}
                {selectedText.length > 50 && (
                    <div className="selected-text-preview">
                        <div className="preview-title">选中内容</div>
                        <div className="preview-text">
                            {selectedText.substring(0, 50)}...
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
} 
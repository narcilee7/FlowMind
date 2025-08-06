/**
 * AI面板组件 - 右侧上下文面板
 * 提供AI建议、写作助手、研究助手等功能
 */

import React, { useState, useEffect } from 'react'
import './AIPanel.scss'

/**
 * AI建议接口
 */
export interface AISuggestion {
    id: string
    title: string
    description: string
    type: 'rewrite' | 'expand' | 'summarize' | 'research' | 'improve'
    confidence: number
    action: () => void
}

/**
 * AI面板属性
 */
export interface AIPanelProps {
    selectedText: string
    onClose: () => void
    onApplySuggestion: (suggestion: AISuggestion) => void
}

/**
 * AI面板组件
 */
export const AIPanel: React.FC<AIPanelProps> = ({
    selectedText,
    onClose,
    onApplySuggestion,
}) => {
    const [activeTab, setActiveTab] = useState<'writing' | 'research' | 'knowledge'>('writing')
    const [isProcessing, setIsProcessing] = useState(false)
    const [suggestions, setSuggestions] = useState<AISuggestion[]>([])

    // 模拟AI建议
    useEffect(() => {
        if (selectedText.trim()) {
            setIsProcessing(true)
            
            // 模拟AI处理延迟
            setTimeout(() => {
                const mockSuggestions: AISuggestion[] = [
                    {
                        id: '1',
                        title: '改写建议',
                        description: '使用更简洁的表达方式重写这段内容',
                        type: 'rewrite',
                        confidence: 0.85,
                        action: () => console.log('应用改写建议')
                    },
                    {
                        id: '2',
                        title: '扩展内容',
                        description: '添加更多细节和例子来丰富内容',
                        type: 'expand',
                        confidence: 0.78,
                        action: () => console.log('应用扩展建议')
                    },
                    {
                        id: '3',
                        title: '语法优化',
                        description: '修正语法错误，提高表达准确性',
                        type: 'improve',
                        confidence: 0.92,
                        action: () => console.log('应用语法优化')
                    }
                ]
                
                setSuggestions(mockSuggestions)
                setIsProcessing(false)
            }, 1500)
        } else {
            setSuggestions([])
        }
    }, [selectedText])

    // 处理建议应用
    const handleApplySuggestion = (suggestion: AISuggestion) => {
        onApplySuggestion(suggestion)
    }

    return (
        <div className="ai-panel-overlay" onClick={onClose}>
            <div className="ai-panel" onClick={e => e.stopPropagation()}>
                {/* 面板头部 */}
                <div className="ai-panel-header">
                    <div className="panel-title">
                        <span className="ai-icon">🤖</span>
                        AI助手
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* 标签页导航 */}
                <div className="ai-panel-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'writing' ? 'active' : ''}`}
                        onClick={() => setActiveTab('writing')}
                    >
                        写作助手
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'research' ? 'active' : ''}`}
                        onClick={() => setActiveTab('research')}
                    >
                        研究助手
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'knowledge' ? 'active' : ''}`}
                        onClick={() => setActiveTab('knowledge')}
                    >
                        知识助手
                    </button>
                </div>

                {/* 面板内容 */}
                <div className="ai-panel-content">
                    {activeTab === 'writing' && (
                        <div className="tab-content">
                            {/* 选中文本预览 */}
                            {selectedText && (
                                <div className="selected-text-section">
                                    <div className="section-title">选中内容</div>
                                    <div className="selected-text">
                                        {selectedText.length > 100 
                                            ? `${selectedText.substring(0, 100)}...` 
                                            : selectedText
                                        }
                                    </div>
                                </div>
                            )}

                            {/* AI建议列表 */}
                            <div className="suggestions-section">
                                <div className="section-title">AI建议</div>
                                
                                {isProcessing ? (
                                    <div className="processing-state">
                                        <div className="loading-spinner"></div>
                                        <div className="processing-text">AI正在分析...</div>
                                    </div>
                                ) : suggestions.length > 0 ? (
                                    <div className="suggestions-list">
                                        {suggestions.map(suggestion => (
                                            <div key={suggestion.id} className="suggestion-item">
                                                <div className="suggestion-header">
                                                    <div className="suggestion-title">{suggestion.title}</div>
                                                    <div className="confidence-badge">
                                                        {Math.round(suggestion.confidence * 100)}%
                                                    </div>
                                                </div>
                                                <div className="suggestion-description">
                                                    {suggestion.description}
                                                </div>
                                                <div className="suggestion-actions">
                                                    <button 
                                                        className="apply-btn"
                                                        onClick={() => handleApplySuggestion(suggestion)}
                                                    >
                                                        应用建议
                                                    </button>
                                                    <button className="preview-btn">
                                                        预览
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-icon">💡</div>
                                        <div className="empty-text">
                                            {selectedText ? '暂无AI建议' : '选中文本以获取AI建议'}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 快速操作 */}
                            <div className="quick-actions-section">
                                <div className="section-title">快速操作</div>
                                <div className="quick-actions">
                                    <button className="quick-action-btn">
                                        ✏️ 改写
                                    </button>
                                    <button className="quick-action-btn">
                                        📝 扩展
                                    </button>
                                    <button className="quick-action-btn">
                                        📋 摘要
                                    </button>
                                    <button className="quick-action-btn">
                                        🌐 翻译
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'research' && (
                        <div className="tab-content">
                            <div className="research-content">
                                <div className="section-title">DeepResearch</div>
                                <div className="research-placeholder">
                                    <div className="placeholder-icon">🔍</div>
                                    <div className="placeholder-text">
                                        深度研究功能开发中...
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'knowledge' && (
                        <div className="tab-content">
                            <div className="knowledge-content">
                                <div className="section-title">知识图谱</div>
                                <div className="knowledge-placeholder">
                                    <div className="placeholder-icon">🧠</div>
                                    <div className="placeholder-text">
                                        知识图谱功能开发中...
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
} 
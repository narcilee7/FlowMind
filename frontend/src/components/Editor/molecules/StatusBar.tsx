/**
 * 状态栏组件 - 底部状态栏
 * 显示当前模式、同步状态、AI提示等信息
 */

import React from 'react'
import { EditorType, SceneTemplate } from '../types/EditorType'
import './StatusBar.scss'

/**
 * 状态栏属性
 */
export interface StatusBarProps {
    currentMode: EditorType
    sceneTemplate: SceneTemplate
    isAIProcessing: boolean
    syncStatus: 'synced' | 'syncing' | 'error' | 'offline'
    onModeChange: (mode: EditorType) => void
    onTemplateChange: (template: SceneTemplate) => void
}

/**
 * 状态栏组件
 */
export const StatusBar: React.FC<StatusBarProps> = ({
    currentMode,
    sceneTemplate,
    isAIProcessing,
    syncStatus,
    onModeChange,
    onTemplateChange,
}) => {
    // 获取模式显示名称
    const getModeDisplayName = (mode: EditorType): string => {
        switch (mode) {
            case EditorType.RICH_TEXT:
                return '富文本'
            case EditorType.GRAPH:
                return '知识图谱'
            case EditorType.CANVAS:
                return 'Canvas'
            case EditorType.TABLE:
                return '表格'
            case EditorType.TIMELINE:
                return '时间线'
            default:
                return '未知模式'
        }
    }

    // 获取模板显示名称
    const getTemplateDisplayName = (template: SceneTemplate): string => {
        switch (template) {
            case SceneTemplate.WRITING:
                return '写作'
            case SceneTemplate.RESEARCH:
                return '研究'
            case SceneTemplate.LEARNING:
                return '学习'
            case SceneTemplate.PLANNING:
                return '规划'
            case SceneTemplate.CREATIVE:
                return '创意'
            default:
                return '未知模板'
        }
    }

    // 获取同步状态图标和文本
    const getSyncStatusInfo = () => {
        switch (syncStatus) {
            case 'synced':
                return { icon: '☁️', text: '已同步', className: 'synced' }
            case 'syncing':
                return { icon: '⏳', text: '同步中...', className: 'syncing' }
            case 'error':
                return { icon: '⚠️', text: '同步错误', className: 'error' }
            case 'offline':
                return { icon: '📴', text: '离线模式', className: 'offline' }
            default:
                return { icon: '❓', text: '未知状态', className: 'unknown' }
        }
    }

    const syncInfo = getSyncStatusInfo()

    return (
        <div className="status-bar">
            {/* 左侧：模式切换 */}
            <div className="status-left">
                <div className="mode-selector">
                    <button 
                        className="mode-btn"
                        onClick={() => onModeChange(currentMode)}
                        title="切换编辑模式"
                    >
                        <span className="mode-icon">
                            {currentMode === EditorType.RICH_TEXT && '📝'}
                            {currentMode === EditorType.GRAPH && '🧠'}
                            {currentMode === EditorType.CANVAS && '🎨'}
                            {currentMode === EditorType.TABLE && '📊'}
                            {currentMode === EditorType.TIMELINE && '📅'}
                        </span>
                        <span className="mode-text">{getModeDisplayName(currentMode)}</span>
                    </button>
                </div>

                <div className="template-selector">
                    <button 
                        className="template-btn"
                        onClick={() => onTemplateChange(sceneTemplate)}
                        title="切换场景模板"
                    >
                        <span className="template-icon">
                            {sceneTemplate === SceneTemplate.WRITING && '✍️'}
                            {sceneTemplate === SceneTemplate.RESEARCH && '🔍'}
                            {sceneTemplate === SceneTemplate.LEARNING && '📚'}
                            {sceneTemplate === SceneTemplate.PLANNING && '📋'}
                            {sceneTemplate === SceneTemplate.CREATIVE && '💡'}
                        </span>
                        <span className="template-text">{getTemplateDisplayName(sceneTemplate)}</span>
                    </button>
                </div>
            </div>

            {/* 中间：AI状态 */}
            <div className="status-center">
                {isAIProcessing && (
                    <div className="ai-status">
                        <div className="ai-spinner"></div>
                        <span className="ai-text">AI处理中...</span>
                    </div>
                )}
            </div>

            {/* 右侧：同步状态和其他信息 */}
            <div className="status-right">
                {/* 同步状态 */}
                <div className={`sync-status ${syncInfo.className}`}>
                    <span className="sync-icon">{syncInfo.icon}</span>
                    <span className="sync-text">{syncInfo.text}</span>
                </div>

                {/* AI提示 */}
                <div className="ai-hint">
                    <span className="hint-icon">💡</span>
                    <span className="hint-text">⌘K 打开命令面板</span>
                </div>

                {/* Token/余额提示（如果是SaaS模式） */}
                <div className="token-info">
                    <span className="token-icon">🎫</span>
                    <span className="token-text">剩余: 1,234</span>
                </div>
            </div>
        </div>
    )
} 
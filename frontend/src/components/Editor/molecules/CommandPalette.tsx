/**
 * 命令面板组件 - 全局功能入口
 * 支持模糊搜索功能、文档、AI指令
 */

import React, { useState, useEffect, useRef } from 'react'
import { EditorType, SceneTemplate } from '../types/EditorType'
import './CommandPalette.scss'

/**
 * 命令项接口
 */
export interface CommandItem {
    id: string
    title: string
    description: string
    icon: string
    category: 'document' | 'ai' | 'view' | 'settings'
    shortcut?: string
    action: () => void
}

/**
 * 命令面板属性
 */
export interface CommandPaletteProps {
    onClose: () => void
    onSelect: (command: CommandItem) => void
}

/**
 * 命令面板组件
 */
export const CommandPalette: React.FC<CommandPaletteProps> = ({
    onClose,
    onSelect,
}) => {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    // 预定义命令列表
    const commands: CommandItem[] = [
        // 文档操作
        {
            id: 'new-document',
            title: '新建文档',
            description: '创建一个新的空白文档',
            icon: '📄',
            category: 'document',
            action: () => console.log('新建文档')
        },
        {
            id: 'save-document',
            title: '保存文档',
            description: '保存当前文档',
            icon: '💾',
            category: 'document',
            shortcut: '⌘S',
            action: () => console.log('保存文档')
        },
        {
            id: 'export-pdf',
            title: '导出为PDF',
            description: '将文档导出为PDF格式',
            icon: '📤',
            category: 'document',
            action: () => console.log('导出PDF')
        },
        
        // AI功能
        {
            id: 'ai-continue',
            title: 'AI续写',
            description: '使用AI继续当前内容',
            icon: '🤖',
            category: 'ai',
            action: () => console.log('AI续写')
        },
        {
            id: 'ai-rewrite',
            title: 'AI改写',
            description: '使用AI改写选中内容',
            icon: '✏️',
            category: 'ai',
            action: () => console.log('AI改写')
        },
        {
            id: 'ai-research',
            title: 'DeepResearch',
            description: '深度研究助手',
            icon: '🔍',
            category: 'ai',
            action: () => console.log('DeepResearch')
        },
        {
            id: 'ai-summarize',
            title: 'AI摘要',
            description: '生成文档摘要',
            icon: '📝',
            category: 'ai',
            action: () => console.log('AI摘要')
        },
        
        // 视图切换
        {
            id: 'view-rich-text',
            title: '富文本视图',
            description: '切换到富文本编辑模式',
            icon: '📝',
            category: 'view',
            action: () => console.log('切换到富文本')
        },
        {
            id: 'view-graph',
            title: '知识图谱',
            description: '切换到知识图谱视图',
            icon: '🧠',
            category: 'view',
            action: () => console.log('切换到图谱')
        },
        {
            id: 'view-canvas',
            title: 'Canvas视图',
            description: '切换到Canvas白板模式',
            icon: '🎨',
            category: 'view',
            action: () => console.log('切换到Canvas')
        },
        {
            id: 'view-timeline',
            title: '时间线视图',
            description: '切换到时间线视图',
            icon: '📅',
            category: 'view',
            action: () => console.log('切换到时间线')
        },
        
        // 设置
        {
            id: 'settings',
            title: '设置',
            description: '打开应用设置',
            icon: '⚙️',
            category: 'settings',
            action: () => console.log('打开设置')
        },
        {
            id: 'theme-toggle',
            title: '切换主题',
            description: '在浅色和深色主题间切换',
            icon: '🌙',
            category: 'settings',
            action: () => console.log('切换主题')
        }
    ]

    // 过滤命令
    const filteredCommands = commands.filter(command =>
        command.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        command.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        command.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // 处理键盘导航
    const handleKeyDown = (event: React.KeyboardEvent) => {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault()
                setSelectedIndex(prev => 
                    prev < filteredCommands.length - 1 ? prev + 1 : 0
                )
                break
            case 'ArrowUp':
                event.preventDefault()
                setSelectedIndex(prev => 
                    prev > 0 ? prev - 1 : filteredCommands.length - 1
                )
                break
            case 'Enter':
                event.preventDefault()
                if (filteredCommands[selectedIndex]) {
                    onSelect(filteredCommands[selectedIndex])
                }
                break
            case 'Escape':
                event.preventDefault()
                onClose()
                break
        }
    }

    // 处理命令选择
    const handleCommandSelect = (command: CommandItem) => {
        onSelect(command)
    }

    // 自动聚焦输入框
    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    // 滚动到选中项
    useEffect(() => {
        if (listRef.current) {
            const selectedElement = listRef.current.children[selectedIndex] as HTMLElement
            if (selectedElement) {
                selectedElement.scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth'
                })
            }
        }
    }, [selectedIndex])

    // 重置选中索引当搜索结果变化时
    useEffect(() => {
        setSelectedIndex(0)
    }, [searchQuery])

    return (
        <div className="command-palette-overlay" onClick={onClose}>
            <div className="command-palette" onClick={e => e.stopPropagation()}>
                {/* 搜索输入框 */}
                <div className="command-palette-header">
                    <div className="search-icon">🔍</div>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="搜索命令、文档或AI功能..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="command-palette-input"
                    />
                    <div className="shortcut-hint">⌘K</div>
                </div>

                {/* 命令列表 */}
                <div className="command-palette-list" ref={listRef}>
                    {filteredCommands.length > 0 ? (
                        filteredCommands.map((command, index) => (
                            <div
                                key={command.id}
                                className={`command-item ${index === selectedIndex ? 'selected' : ''}`}
                                onClick={() => handleCommandSelect(command)}
                            >
                                <div className="command-icon">{command.icon}</div>
                                <div className="command-content">
                                    <div className="command-title">{command.title}</div>
                                    <div className="command-description">{command.description}</div>
                                </div>
                                {command.shortcut && (
                                    <div className="command-shortcut">{command.shortcut}</div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="no-results">
                            <div className="no-results-icon">🔍</div>
                            <div className="no-results-text">未找到相关命令</div>
                        </div>
                    )}
                </div>

                {/* 底部提示 */}
                <div className="command-palette-footer">
                    <div className="footer-hint">
                        <span>↑↓</span> 导航
                        <span>↵</span> 选择
                        <span>Esc</span> 关闭
                    </div>
                </div>
            </div>
        </div>
    )
} 
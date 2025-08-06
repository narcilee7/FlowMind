/**
 * 斜杠菜单组件 - 插入内容菜单
 * 输入 / 时呼出，支持键盘导航
 */

import React, { useState, useEffect, useRef } from 'react'
import './SlashMenu.scss'

/**
 * 菜单项接口
 */
export interface SlashMenuItem {
    id: string
    title: string
    description: string
    icon: string
    category: 'content' | 'ai' | 'media' | 'knowledge'
    action: () => void
}

/**
 * 斜杠菜单属性
 */
export interface SlashMenuProps {
    position: { x: number; y: number }
    onClose: () => void
    onSelect: (item: SlashMenuItem) => void
}

/**
 * 斜杠菜单组件
 */
export const SlashMenu: React.FC<SlashMenuProps> = ({
    position,
    onClose,
    onSelect,
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')
    const menuRef = useRef<HTMLDivElement>(null)

    // 预定义菜单项
    const menuItems: SlashMenuItem[] = [
        // 内容类型
        {
            id: 'heading-1',
            title: '一级标题',
            description: '大标题',
            icon: 'H1',
            category: 'content',
            action: () => console.log('插入一级标题')
        },
        {
            id: 'heading-2',
            title: '二级标题',
            description: '中标题',
            icon: 'H2',
            category: 'content',
            action: () => console.log('插入二级标题')
        },
        {
            id: 'paragraph',
            title: '段落',
            description: '普通文本段落',
            icon: '¶',
            category: 'content',
            action: () => console.log('插入段落')
        },
        {
            id: 'bullet-list',
            title: '无序列表',
            description: '项目符号列表',
            icon: '•',
            category: 'content',
            action: () => console.log('插入无序列表')
        },
        {
            id: 'numbered-list',
            title: '有序列表',
            description: '数字编号列表',
            icon: '1.',
            category: 'content',
            action: () => console.log('插入有序列表')
        },
        {
            id: 'code-block',
            title: '代码块',
            description: '代码片段',
            icon: '</>',
            category: 'content',
            action: () => console.log('插入代码块')
        },
        {
            id: 'quote',
            title: '引用',
            description: '引用文本',
            icon: '"',
            category: 'content',
            action: () => console.log('插入引用')
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
            id: 'ai-summarize',
            title: 'AI摘要',
            description: '生成内容摘要',
            icon: '📝',
            category: 'ai',
            action: () => console.log('AI摘要')
        },
        {
            id: 'ai-research',
            title: 'DeepResearch',
            description: '深度研究助手',
            icon: '🔍',
            category: 'ai',
            action: () => console.log('DeepResearch')
        },
        
        // 媒体与图表
        {
            id: 'image',
            title: '图片',
            description: '插入图片',
            icon: '🖼️',
            category: 'media',
            action: () => console.log('插入图片')
        },
        {
            id: 'table',
            title: '表格',
            description: '插入表格',
            icon: '📊',
            category: 'media',
            action: () => console.log('插入表格')
        },
        {
            id: 'chart',
            title: '图表',
            description: '插入图表',
            icon: '📈',
            category: 'media',
            action: () => console.log('插入图表')
        },
        {
            id: 'mermaid',
            title: '流程图',
            description: 'Mermaid流程图',
            icon: '🔄',
            category: 'media',
            action: () => console.log('插入流程图')
        },
        
        // 知识管理
        {
            id: 'link',
            title: '链接',
            description: '插入链接',
            icon: '🔗',
            category: 'knowledge',
            action: () => console.log('插入链接')
        },
        {
            id: 'tag',
            title: '标签',
            description: '添加标签',
            icon: '🏷️',
            category: 'knowledge',
            action: () => console.log('添加标签')
        },
        {
            id: 'graph-node',
            title: '图谱节点',
            description: '插入知识图谱节点',
            icon: '🧠',
            category: 'knowledge',
            action: () => console.log('插入图谱节点')
        }
    ]

    // 过滤菜单项
    const filteredItems = menuItems.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // 处理键盘导航
    const handleKeyDown = (event: KeyboardEvent) => {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault()
                setSelectedIndex(prev => 
                    prev < filteredItems.length - 1 ? prev + 1 : 0
                )
                break
            case 'ArrowUp':
                event.preventDefault()
                setSelectedIndex(prev => 
                    prev > 0 ? prev - 1 : filteredItems.length - 1
                )
                break
            case 'Enter':
                event.preventDefault()
                if (filteredItems[selectedIndex]) {
                    onSelect(filteredItems[selectedIndex])
                }
                break
            case 'Escape':
                event.preventDefault()
                onClose()
                break
        }
    }

    // 处理菜单项选择
    const handleItemSelect = (item: SlashMenuItem) => {
        onSelect(item)
    }

    // 添加键盘事件监听
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [filteredItems, selectedIndex])

    // 重置选中索引当搜索结果变化时
    useEffect(() => {
        setSelectedIndex(0)
    }, [searchQuery])

    // 点击外部关闭菜单
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [onClose])

    // 计算菜单位置
    const menuStyle = {
        left: Math.min(position.x, window.innerWidth - 300),
        top: Math.min(position.y, window.innerHeight - 400),
    }

    return (
        <div className="slash-menu-overlay">
            <div 
                ref={menuRef}
                className="slash-menu"
                style={menuStyle}
            >
                {/* 搜索输入框 */}
                <div className="slash-menu-header">
                    <div className="search-icon">🔍</div>
                    <input
                        type="text"
                        placeholder="搜索插入内容..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="slash-menu-input"
                        autoFocus
                    />
                </div>

                {/* 菜单列表 */}
                <div className="slash-menu-list">
                    {filteredItems.length > 0 ? (
                        filteredItems.map((item, index) => (
                            <div
                                key={item.id}
                                className={`slash-menu-item ${index === selectedIndex ? 'selected' : ''}`}
                                onClick={() => handleItemSelect(item)}
                            >
                                <div className="item-icon">{item.icon}</div>
                                <div className="item-content">
                                    <div className="item-title">{item.title}</div>
                                    <div className="item-description">{item.description}</div>
                                </div>
                                <div className="item-category">{item.category}</div>
                            </div>
                        ))
                    ) : (
                        <div className="no-results">
                            <div className="no-results-icon">🔍</div>
                            <div className="no-results-text">未找到相关内容</div>
                        </div>
                    )}
                </div>

                {/* 底部提示 */}
                <div className="slash-menu-footer">
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
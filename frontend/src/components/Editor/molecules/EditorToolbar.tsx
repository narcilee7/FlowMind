/**
 * 编辑器工具栏 - 极简设计，渐进暴露
 * 
 * 设计原则：
 * 1. 极简呈现：首次进入时只显示核心功能
 * 2. 渐进暴露：根据用户操作动态显示更多功能
 * 3. 上下文驱动：功能根据当前选择内容动态变化
 * 4. 一致性体验：保持统一的视觉风格和交互逻辑
 */

import React, { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import { EditorType, SceneTemplate } from '../types/EditorType'
import { Selection } from '../types/EditorAST'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'

// 样式组件 - 极简设计
const ToolbarContainer = styled.div<{ isVisible: boolean; isMinimal: boolean }>`
  position: fixed;
  top: ${props => props.isMinimal ? '20px' : '60px'};
  left: 50%;
  transform: translateX(-50%);
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: ${props => props.isMinimal ? '8px' : '12px'};
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1000;
  opacity: ${props => props.isVisible ? 1 : 0};
  visibility: ${props => props.isVisible ? 'visible' : 'hidden'};
  transition: all 0.2s ease-in-out;
  
  /* 极简模式样式 */
  ${props => props.isMinimal && `
    padding: 6px;
    gap: 4px;
    border-radius: 20px;
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.9);
  `}
`

const ToolbarGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:not(:last-child)::after {
    content: '';
    width: 1px;
    height: 20px;
    background: var(--border);
    margin: 0 4px;
  }
`

const ContextualTools = styled.div<{ isVisible: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: ${props => props.isVisible ? 1 : 0};
  transform: ${props => props.isVisible ? 'translateX(0)' : 'translateX(-10px)'};
  transition: all 0.2s ease-in-out;
`

/**
 * 工具栏配置
 */
interface ToolbarConfig {
  /** 是否启用极简模式 */
  minimalMode: boolean
  /** 是否显示上下文工具 */
  showContextualTools: boolean
  /** 当前编辑器类型 */
  editorType: EditorType
  /** 当前场景模板 */
  sceneTemplate: SceneTemplate
}

/**
 * 工具栏属性
 */
interface EditorToolbarProps {
  /** 当前选择状态 */
  selection: Selection
  /** 编辑器类型 */
  editorType: EditorType
  /** 场景模板 */
  sceneTemplate: SceneTemplate
  /** 是否可见 */
  isVisible: boolean
  /** 配置选项 */
  config?: Partial<ToolbarConfig>
  /** 事件回调 */
  onCommand?: (command: string, data?: any) => void
  /** 模式切换回调 */
  onModeChange?: (mode: 'minimal' | 'full') => void
}

/**
 * 编辑器工具栏组件
 */
export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  selection,
  editorType,
  sceneTemplate,
  isVisible,
  config = {},
  onCommand,
  onModeChange,
}) => {
  // ==================== 状态管理 ====================
  
  /** 工具栏配置 */
  const [toolbarConfig, setToolbarConfig] = useState<ToolbarConfig>({
    minimalMode: true, // 默认极简模式
    showContextualTools: false,
    editorType,
    sceneTemplate,
    ...config
  })

  /** 上下文工具状态 */
  const [contextualTools, setContextualTools] = useState<string[]>([])

  // ==================== 上下文分析 ====================
  
  /**
   * 分析当前上下文，决定显示哪些工具
   */
  const analyzeContext = useCallback(() => {
    const tools: string[] = []
    
    // 根据选择内容分析
    if (selection.nodeIds.length > 0) {
      tools.push('format', 'ai-rewrite', 'convert')
    }
    
    // 根据编辑器类型分析
    switch (editorType) {
      case EditorType.RICH_TEXT:
        if (selection.type === 'text') {
          tools.push('bold', 'italic', 'link', 'ai-completion')
        }
        break
      case EditorType.GRAPH:
        tools.push('add-node', 'add-edge', 'layout')
        break
      case EditorType.CANVAS:
        tools.push('draw', 'shape', 'text', 'image')
        break
      case EditorType.TABLE:
        tools.push('add-row', 'add-column', 'sort', 'filter')
        break
      case EditorType.TIMELINE:
        tools.push('add-item', 'add-milestone', 'timeline-view')
        break
    }
    
    // 根据场景模板分析
    switch (sceneTemplate) {
      case SceneTemplate.WRITING:
        tools.push('ai-writing', 'outline', 'research')
        break
      case SceneTemplate.RESEARCH:
        tools.push('ai-research', 'knowledge-extract', 'source-cite')
        break
      case SceneTemplate.LEARNING:
        tools.push('ai-explain', 'quiz-generate', 'concept-map')
        break
      case SceneTemplate.PLANNING:
        tools.push('ai-plan', 'timeline', 'milestone')
        break
      case SceneTemplate.CREATIVE:
        tools.push('ai-inspire', 'mood-board', 'sketch')
        break
    }
    
    setContextualTools(tools)
  }, [selection, editorType, sceneTemplate])

  // ==================== 工具渲染 ====================
  
  /**
   * 渲染核心工具
   */
  const renderCoreTools = () => (
    <ToolbarGroup>
      {/* 新建文档 */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onCommand?.('new-document')}
      >
        新建
      </Button>
      
      {/* 插入菜单 */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onCommand?.('show-slash-menu')}
      >
        +
      </Button>
      
      {/* 搜索 */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onCommand?.('show-search')}
      >
        搜索
      </Button>
    </ToolbarGroup>
  )

  /**
   * 渲染上下文工具
   */
  const renderContextualTools = () => {
    if (!toolbarConfig.showContextualTools || contextualTools.length === 0) {
      return null
    }

    return (
      <ContextualTools isVisible={toolbarConfig.showContextualTools}>
        {contextualTools.includes('format') && (
          <ToolbarGroup>
            <IconButton
              size="sm"
              variant="ghost"
              onClick={() => onCommand?.('format-bold')}
              title="加粗 (⌘B)"
            >
              B
            </IconButton>
            <IconButton
              size="sm"
              variant="ghost"
              onClick={() => onCommand?.('format-italic')}
              title="斜体 (⌘I)"
            >
              I
            </IconButton>
          </ToolbarGroup>
        )}
        
                 {contextualTools.includes('ai-rewrite') && (
           <ToolbarGroup>
             <Button
               size="sm"
               variant="outline"
               onClick={() => onCommand?.('ai-rewrite')}
             >
               AI重写
             </Button>
           </ToolbarGroup>
         )}
         
         {contextualTools.includes('convert') && (
           <ToolbarGroup>
             <Button
               size="sm"
               variant="ghost"
               onClick={() => onCommand?.('convert-block')}
             >
               转换
             </Button>
           </ToolbarGroup>
         )}
      </ContextualTools>
    )
  }

  /**
   * 渲染模式切换
   */
  const renderModeToggle = () => (
    <ToolbarGroup>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          const newMode = toolbarConfig.minimalMode ? 'full' : 'minimal'
          setToolbarConfig(prev => ({ ...prev, minimalMode: !prev.minimalMode }))
          onModeChange?.(newMode)
        }}
      >
        {toolbarConfig.minimalMode ? '⋯' : '−'}
      </Button>
    </ToolbarGroup>
  )

  // ==================== 效果处理 ====================
  
  /** 上下文变化时更新工具 */
  useEffect(() => {
    analyzeContext()
  }, [analyzeContext])

  /** 选择变化时显示上下文工具 */
  useEffect(() => {
    if (selection.nodeIds.length > 0 || selection.type === 'text') {
      setToolbarConfig(prev => ({ ...prev, showContextualTools: true }))
    } else {
      setToolbarConfig(prev => ({ ...prev, showContextualTools: false }))
    }
  }, [selection])

  // ==================== 渲染 ====================
  
  return (
    <ToolbarContainer 
      isVisible={isVisible} 
      isMinimal={toolbarConfig.minimalMode}
    >
      {renderCoreTools()}
      {renderContextualTools()}
      {renderModeToggle()}
    </ToolbarContainer>
  )
}

export default EditorToolbar 
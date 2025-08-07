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
import { EditorType, SceneTemplate } from '../types/EditorType'
import { Selection } from '../types/EditorAST'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

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
    <div className="flex items-center gap-1">
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
    </div>
  )

  /**
   * 渲染上下文工具
   */
  const renderContextualTools = () => {
    if (!toolbarConfig.showContextualTools || contextualTools.length === 0) {
      return null
    }

    return (
      <div className={cn(
        "flex items-center gap-1 transition-all duration-200",
        toolbarConfig.showContextualTools 
          ? "opacity-100 translate-x-0" 
          : "opacity-0 -translate-x-2.5"
      )}>
        {contextualTools.includes('format') && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCommand?.('format-bold')}
              title="加粗 (⌘B)"
            >
              B
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCommand?.('format-italic')}
              title="斜体 (⌘I)"
            >
              I
            </Button>
          </div>
        )}
        
        {contextualTools.includes('ai-rewrite') && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCommand?.('ai-rewrite')}
            >
              AI重写
            </Button>
          </div>
        )}
        
        {contextualTools.includes('convert') && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCommand?.('convert-block')}
            >
              转换
            </Button>
          </div>
        )}
      </div>
    )
  }

  /**
   * 渲染模式切换
   */
  const renderModeToggle = () => (
    <div className="flex items-center gap-1">
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
    </div>
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
    <div
      className={cn(
        "fixed left-1/2 transform -translate-x-1/2 bg-background border border-border rounded-lg shadow-lg flex items-center gap-2 z-[1000] transition-all duration-200",
        toolbarConfig.minimalMode 
          ? "top-5 p-1.5 gap-1 rounded-full backdrop-blur-md bg-white/90" 
          : "top-15 p-3 gap-2",
        isVisible ? "opacity-100 visible" : "opacity-0 invisible"
      )}
    >
      {renderCoreTools()}
      
      {/* 分隔线 */}
      <div className="w-px h-5 bg-border mx-1" />
      
      {renderContextualTools()}
      
      {/* 分隔线 */}
      <div className="w-px h-5 bg-border mx-1" />
      
      {renderModeToggle()}
    </div>
  )
}

export default EditorToolbar 
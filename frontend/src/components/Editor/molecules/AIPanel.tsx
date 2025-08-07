/**
 * AI面板 - 智能助手集成
 * 
 * 设计原则：
 * 1. 右侧浮动面板，分Tab管理不同AI功能
 * 2. 上下文驱动：根据用户选择内容提供相关建议
 * 3. 结果对比：支持多个AI结果的对比和选择
 * 4. 一键插入：AI生成内容可直接插入到文档中
 */

import React, { useState, useEffect, useCallback } from 'react'
import { EditorType, SceneTemplate } from '../types/EditorType'
import { Selection } from '../types/EditorAST'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

/**
 * AI功能类型
 */
type AIFunctionType = 'writing' | 'research' | 'knowledge'

/**
 * AI建议项
 */
interface AISuggestion {
  id: string
  type: AIFunctionType
  title: string
  content: string
  confidence: number
  context?: string
}

/**
 * AI面板属性
 */
interface AIPanelProps {
  /** 是否可见 */
  isVisible: boolean
  /** 是否收起 */
  isCollapsed: boolean
  /** 当前选择状态 */
  selection: Selection
  /** 编辑器类型 */
  editorType: EditorType
  /** 场景模板 */
  sceneTemplate: SceneTemplate
  /** 事件回调 */
  onToggleCollapse?: () => void
  onInsertContent?: (content: string) => void
  onAIAction?: (action: string, data?: any) => void
}

/**
 * AI面板组件
 */
export const AIPanel: React.FC<AIPanelProps> = ({
  isVisible,
  isCollapsed,
  selection,
  editorType,
  sceneTemplate,
  onToggleCollapse,
  onInsertContent,
  onAIAction,
}) => {
  // ==================== 状态管理 ====================
  
  /** 当前激活的Tab */
  const [activeTab, setActiveTab] = useState<AIFunctionType>('writing')
  
  /** AI建议列表 */
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  
  /** 加载状态 */
  const [isLoading, setIsLoading] = useState(false)

  // ==================== AI功能配置 ====================
  
  /**
   * 获取AI功能配置
   */
  const getAIFunctions = useCallback(() => {
    const functions = {
      writing: {
        title: '写作助手',
        description: '智能写作、改写、续写',
        actions: ['rewrite', 'continue', 'improve', 'summarize']
      },
      research: {
        title: '研究助手',
        description: '深度研究、资料收集',
        actions: ['research', 'analyze', 'compare', 'cite']
      },
      knowledge: {
        title: '知识助手',
        description: '知识提取、概念解释',
        actions: ['extract', 'explain', 'connect', 'organize']
      }
    }
    
    return functions
  }, [])

  // ==================== 上下文分析 ====================
  
  /**
   * 分析当前上下文，生成AI建议
   */
  const analyzeContext = useCallback(async () => {
    if (!selection.nodeIds.length && selection.type !== 'text') {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      // 模拟AI分析过程
      const newSuggestions: AISuggestion[] = []
      
      // 根据选择内容生成建议
      if (selection.type === 'text') {
        newSuggestions.push({
          id: 'suggestion-1',
          type: 'writing',
          title: '改进写作',
          content: '这段文字可以更加简洁明了，建议删除冗余词汇...',
          confidence: 0.85
        })
        
        newSuggestions.push({
          id: 'suggestion-2',
          type: 'knowledge',
          title: '知识提取',
          content: '从这段文字中提取到3个关键概念：概念A、概念B、概念C',
          confidence: 0.92
        })
      }
      
      // 根据编辑器类型生成建议
      switch (editorType) {
        case EditorType.RICH_TEXT:
          newSuggestions.push({
            id: 'suggestion-3',
            type: 'writing',
            title: '续写建议',
            content: '基于当前内容，建议接下来可以讨论...',
            confidence: 0.78
          })
          break
        case EditorType.GRAPH:
          newSuggestions.push({
            id: 'suggestion-4',
            type: 'knowledge',
            title: '关系发现',
            content: '发现节点A与节点B之间存在潜在关联...',
            confidence: 0.89
          })
          break
      }
      
      // 根据场景模板生成建议
      switch (sceneTemplate) {
        case SceneTemplate.WRITING:
          newSuggestions.push({
            id: 'suggestion-5',
            type: 'writing',
            title: '写作大纲',
            content: '建议的文章结构：1. 引言 2. 主体 3. 结论',
            confidence: 0.91
          })
          break
        case SceneTemplate.RESEARCH:
          newSuggestions.push({
            id: 'suggestion-6',
            type: 'research',
            title: '研究建议',
            content: '建议深入研究以下方向：方向A、方向B',
            confidence: 0.87
          })
          break
      }
      
      setSuggestions(newSuggestions)
    } catch (error) {
      console.error('AI analysis failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selection, editorType, sceneTemplate])

  // ==================== 事件处理 ====================
  
  /**
   * 处理AI建议点击
   */
  const handleSuggestionClick = useCallback((suggestion: AISuggestion) => {
    onAIAction?.(`apply-${suggestion.type}`, suggestion)
  }, [onAIAction])

  /**
   * 处理插入内容
   */
  const handleInsertContent = useCallback((content: string) => {
    onInsertContent?.(content)
  }, [onInsertContent])

  /**
   * 处理AI操作
   */
  const handleAIAction = useCallback((action: string) => {
    onAIAction?.(action, { selection, editorType, sceneTemplate })
  }, [onAIAction, selection, editorType, sceneTemplate])

  // ==================== 效果处理 ====================
  
  /** 上下文变化时重新分析 */
  useEffect(() => {
    analyzeContext()
  }, [analyzeContext])

  // ==================== 渲染 ====================
  
  /**
   * 渲染Tab按钮
   */
  const renderTabs = () => {
    const functions = getAIFunctions()
    
    return (
      <div className="flex border-b border-border">
        {Object.entries(functions).map(([key, func]) => (
          <button
            key={key}
            className={cn(
              "flex-1 px-4 py-3 text-xs font-medium transition-all duration-200 border-b-2",
              activeTab === key
                ? "bg-accent text-accent-foreground border-primary"
                : "text-muted-foreground border-transparent hover:bg-accent hover:text-accent-foreground"
            )}
            onClick={() => setActiveTab(key as AIFunctionType)}
          >
            {func.title}
          </button>
        ))}
      </div>
    )
  }

  /**
   * 渲染AI建议
   */
  const renderSuggestions = () => {
    const filteredSuggestions = suggestions.filter(s => s.type === activeTab)
    
    if (isLoading) {
      return <div>分析中...</div>
    }
    
    if (filteredSuggestions.length === 0) {
      return <div>暂无建议</div>
    }
    
    return filteredSuggestions.map(suggestion => (
      <div
        key={suggestion.id}
        className="p-3 mb-3 bg-accent border border-border rounded-lg cursor-pointer transition-all duration-200 hover:border-primary"
        onClick={() => handleSuggestionClick(suggestion)}
      >
        <div className="text-xs font-semibold text-foreground mb-1">
          {suggestion.title}
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">
          {suggestion.content}
        </div>
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation()
              handleInsertContent(suggestion.content)
            }}
          >
            插入
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation()
              handleAIAction(`improve-${suggestion.id}`)
            }}
          >
            改进
          </Button>
        </div>
      </div>
    ))
  }

  /**
   * 渲染快速操作
   */
  const renderQuickActions = () => {
    const functions = getAIFunctions()
    const currentFunction = functions[activeTab]
    
    return (
      <div className="mb-4">
        <div className="text-xs font-semibold mb-2">
          快速操作
        </div>
        <div className="flex flex-wrap gap-2">
          {currentFunction.actions.map(action => (
            <Button
              key={action}
              size="sm"
              variant="outline"
              onClick={() => handleAIAction(action)}
            >
              {action}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "fixed top-20 w-80 h-[calc(100vh-120px)] bg-background border border-border rounded-lg shadow-lg flex flex-col z-[1000] transition-all duration-300",
        isCollapsed ? "-right-80" : "right-5",
        isVisible ? "opacity-100 visible" : "opacity-0 invisible"
      )}
    >
      <Button
        size="sm"
        variant="ghost"
        className="absolute -left-8 top-1/2 -translate-y-1/2 bg-background border border-border border-r-0 rounded-l-lg w-8 h-8"
        onClick={onToggleCollapse}
      >
        {isCollapsed ? '›' : '‹'}
      </Button>
      
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="m-0 text-sm font-semibold text-foreground">AI助手</h3>
      </div>
      
      {renderTabs()}
      
      <div className="flex-1 p-4 overflow-y-auto">
        {renderQuickActions()}
        {renderSuggestions()}
      </div>
    </div>
  )
}

export default AIPanel 
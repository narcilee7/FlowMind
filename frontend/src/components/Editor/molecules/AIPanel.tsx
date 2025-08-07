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
import styled from 'styled-components'
import { EditorType, SceneTemplate } from '../types/EditorType'
import { Selection } from '../types/EditorAST'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'

// 样式组件
const AIPanelContainer = styled.div<{ isVisible: boolean; isCollapsed: boolean }>`
  position: fixed;
  top: 80px;
  right: ${props => props.isCollapsed ? '-300px' : '20px'};
  width: 320px;
  height: calc(100vh - 120px);
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  transition: all 0.3s ease-in-out;
  opacity: ${props => props.isVisible ? 1 : 0};
  visibility: ${props => props.isVisible ? 'visible' : 'hidden'};
`

const PanelHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--foreground);
`

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid var(--border);
`

const TabButton = styled.button<{ isActive: boolean }>`
  flex: 1;
  padding: 12px 16px;
  background: ${props => props.isActive ? 'var(--accent)' : 'transparent'};
  color: ${props => props.isActive ? 'var(--accent-foreground)' : 'var(--muted-foreground)'};
  border: none;
  border-bottom: 2px solid ${props => props.isActive ? 'var(--primary)' : 'transparent'};
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
  
  &:hover {
    background: ${props => props.isActive ? 'var(--accent)' : 'var(--accent)'};
    color: var(--accent-foreground);
  }
`

const PanelContent = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
`

const AISuggestion = styled.div`
  padding: 12px;
  margin-bottom: 12px;
  background: var(--accent);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  
  &:hover {
    background: var(--accent);
    border-color: var(--primary);
  }
`

const SuggestionTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: var(--foreground);
  margin-bottom: 4px;
`

const SuggestionContent = styled.div`
  font-size: 12px;
  color: var(--muted-foreground);
  line-height: 1.4;
`

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`

const CollapseButton = styled(IconButton)`
  position: absolute;
  left: -32px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--background);
  border: 1px solid var(--border);
  border-right: none;
  border-radius: var(--radius) 0 0 var(--radius);
  width: 32px;
  height: 32px;
`

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
      <TabContainer>
        {Object.entries(functions).map(([key, func]) => (
          <TabButton
            key={key}
            isActive={activeTab === key}
            onClick={() => setActiveTab(key as AIFunctionType)}
          >
            {func.title}
          </TabButton>
        ))}
      </TabContainer>
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
      <AISuggestion
        key={suggestion.id}
        onClick={() => handleSuggestionClick(suggestion)}
      >
        <SuggestionTitle>{suggestion.title}</SuggestionTitle>
        <SuggestionContent>{suggestion.content}</SuggestionContent>
        <ActionButtons>
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
        </ActionButtons>
      </AISuggestion>
    ))
  }

  /**
   * 渲染快速操作
   */
  const renderQuickActions = () => {
    const functions = getAIFunctions()
    const currentFunction = functions[activeTab]
    
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
          快速操作
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
    <AIPanelContainer isVisible={isVisible} isCollapsed={isCollapsed}>
      <CollapseButton
        size="sm"
        variant="ghost"
        onClick={onToggleCollapse}
      >
        {isCollapsed ? '›' : '‹'}
      </CollapseButton>
      
      <PanelHeader>
        <PanelTitle>AI助手</PanelTitle>
      </PanelHeader>
      
      {renderTabs()}
      
      <PanelContent>
        {renderQuickActions()}
        {renderSuggestions()}
      </PanelContent>
    </AIPanelContainer>
  )
}

export default AIPanel 
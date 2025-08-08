"use client"

/**
 * 编辑器核心组件（按 mode 渲染适配器）
 */

import React, { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { EditorMode } from '@/components/Editor/types/EditorMode'
import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'
import EditorCore, { EditorCommands } from '@/components/Editor/core/EditorCore'

interface EditorShellProps {
  mode: EditorMode
}

function mapModeToEditorType(mode: EditorMode): EditorType {
  switch (mode) {
    case 'writing':
      return EditorType.RICH_TEXT
    case 'graph':
      return EditorType.GRAPH
    case 'canvas':
      return EditorType.CANVAS
    case 'table':
      return EditorType.TABLE
    case 'timeline':
    case 'card':
      return EditorType.TIMELINE
    // 场景型值做降级映射（用于 auto 初始）
    case 'research':
      return EditorType.GRAPH
    case 'planning':
      return EditorType.CANVAS
    case 'learning':
      return EditorType.TIMELINE
    case 'creative':
      return EditorType.CANVAS
    default:
      return EditorType.RICH_TEXT
  }
}

function mapToSceneTemplate(mode: EditorMode, templateParam?: string | null): SceneTemplate {
  const fromParam = (templateParam || '').toLowerCase()
  switch (fromParam) {
    case 'research':
    case 'ai-research':
      return SceneTemplate.RESEARCH
    case 'learning':
    case 'ai-learning':
      return SceneTemplate.LEARNING
    case 'planning':
    case 'ai-planning':
      return SceneTemplate.PLANNING
    case 'creative':
    case 'ai-creative':
      return SceneTemplate.CREATIVE
    case 'writing':
    case 'ai-writing':
      return SceneTemplate.WRITING
    default:
      break
  }

  // 未提供 template 参数时，根据 mode 推断默认场景
  switch (mode) {
    case 'research':
      return SceneTemplate.RESEARCH
    case 'learning':
      return SceneTemplate.LEARNING
    case 'planning':
      return SceneTemplate.PLANNING
    case 'creative':
      return SceneTemplate.CREATIVE
    default:
      return SceneTemplate.WRITING
  }
}

const EditorShell = React.memo(function EditorShell({ mode }: EditorShellProps) {
  const searchParams = useSearchParams()
  const templateParam = searchParams.get('template')

  const editorType = useMemo(() => mapModeToEditorType(mode), [mode])
  const sceneTemplate = useMemo(() => mapToSceneTemplate(mode, templateParam), [mode, templateParam])

  const editorRef = React.useRef<EditorCommands>(null)

  // 暂时的空状态占位（各模式）
  const EmptyState = () => {
    switch (mode) {
      case 'writing':
        return <div className="p-6 text-sm text-muted-foreground">开始写作，按 / 唤起命令，Cmd/Ctrl+K 打开命令面板</div>
      case 'graph':
        return <div className="p-6 text-sm text-muted-foreground">图谱视图：后续接入节点/关系渲染</div>
      case 'canvas':
        return <div className="p-6 text-sm text-muted-foreground">画布视图：后续接入画布与形状工具</div>
      case 'table':
        return <div className="p-6 text-sm text-muted-foreground">表格视图：后续接入数据表格</div>
      case 'timeline':
      case 'card':
        return <div className="p-6 text-sm text-muted-foreground">时间线/卡片视图：后续接入任务/学习卡片</div>
      default:
        return null
    }
  }

  return (
    <div className="w-full h-full relative">
      <EditorCore
        ref={editorRef}
        editorType={editorType}
        sceneTemplate={sceneTemplate}
        className="w-full h-full"
      />
      <div className="pointer-events-none absolute top-0 left-0">
        <EmptyState />
      </div>
    </div>
  )
})

export default EditorShell
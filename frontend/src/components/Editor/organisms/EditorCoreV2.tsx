import React, { useEffect, useRef, useState } from 'react'
import { useEditor } from '@/components/Editor/core/EditorProvider'
import EditorManager from '@/components/Editor/core/EditorAdapterFactory'
import { EditorType, EditorMode, EditorOptions } from '@/components/Editor/types'

interface EditorCoreV2Props {
  className?: string
  showToolbar?: boolean
  showStatusBar?: boolean
  onContentChange?: (content: string) => void
  onEditorTypeChange?: (type: EditorType) => void
  onEditorModeChange?: (mode: EditorMode) => void
}

export const EditorCoreV2: React.FC<EditorCoreV2Props> = ({
  className = '',
  showToolbar = true,
  showStatusBar = true,
  onContentChange,
  onEditorTypeChange,
  onEditorModeChange
}) => {
  const { state, dispatch, switchEditorType, switchEditorMode } = useEditor()
  const editorRef = useRef<HTMLDivElement>(null)
  const editorManagerRef = useRef<EditorManager>(new EditorManager())
  const [isLoading, setIsLoading] = useState(false)

  // 初始化编辑器
  useEffect(() => {
    if (editorRef.current) {
      initializeEditor()
    }
  }, [state.editorType])

  // 监听内容变化
  useEffect(() => {
    if (onContentChange) {
      onContentChange(state.content)
    }
  }, [state.content, onContentChange])

  const initializeEditor = async () => {
    if (!editorRef.current) return

    setIsLoading(true)
    try {
      const options: EditorOptions = {
        value: state.content,
        language: state.language,
        theme: state.theme,
        readOnly: state.isReadOnly,
        editorType: state.editorType,
        editorMode: state.editorMode,
        markdownOptions: state.markdownState,
        richTextOptions: state.richTextState,
        canvasOptions: state.canvasState
      }

      const adapter = await editorManagerRef.current.createEditor(
        editorRef.current,
        state.editorType,
        options
      )

      // 绑定编辑器事件
      adapter.on('change', (content: string) => {
        dispatch({ type: 'SET_CONTENT', payload: content })
      })

      adapter.on('focus', () => {
        dispatch({ type: 'SET_FOCUS', payload: true })
      })

      adapter.on('blur', () => {
        dispatch({ type: 'SET_FOCUS', payload: false })
      })

      adapter.on('scroll', (scrollData: any) => {
        dispatch({ type: 'SET_SCROLL_POSITION', payload: scrollData })
      })

    } catch (error) {
      console.error('Failed to initialize editor:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditorTypeChange = async (type: EditorType) => {
    if (type === state.editorType) return

    setIsLoading(true)
    try {
      await editorManagerRef.current.switchEditorType(type)
      switchEditorType(type)
      onEditorTypeChange?.(type)
    } catch (error) {
      console.error('Failed to switch editor type:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditorModeChange = (mode: EditorMode) => {
    if (mode === state.editorMode) return

    switchEditorMode(mode)
    onEditorModeChange?.(mode)
  }

  const getEditorTypeLabel = (type: EditorType): string => {
    switch (type) {
      case EditorType.MARKDOWN:
        return 'Markdown'
      case EditorType.RICH_TEXT:
        return '富文本'
      case EditorType.CANVAS:
        return 'Canvas'
      default:
        return '未知'
    }
  }

  const getEditorModeLabel = (mode: EditorMode): string => {
    switch (mode) {
      case EditorMode.EDIT:
        return '编辑'
      case EditorMode.PREVIEW:
        return '预览'
      case EditorMode.SPLIT:
        return '分屏'
      default:
        return '未知'
    }
  }

  return (
    <div className={`editor-core-v2 ${className}`}>
      {/* 工具栏 */}
      {showToolbar && (
        <div className="editor-toolbar">
          <div className="toolbar-left">
            {/* 编辑器类型切换 */}
            <div className="editor-type-selector">
              <select
                value={state.editorType}
                onChange={(e) => handleEditorTypeChange(e.target.value as EditorType)}
                disabled={isLoading}
              >
                <option value={EditorType.MARKDOWN}>
                  {getEditorTypeLabel(EditorType.MARKDOWN)}
                </option>
                <option value={EditorType.RICH_TEXT}>
                  {getEditorTypeLabel(EditorType.RICH_TEXT)}
                </option>
                <option value={EditorType.CANVAS}>
                  {getEditorTypeLabel(EditorType.CANVAS)}
                </option>
              </select>
            </div>

            {/* 编辑器模式切换（仅对Markdown编辑器有效） */}
            {state.editorType === EditorType.MARKDOWN && (
              <div className="editor-mode-selector">
                <button
                  className={`mode-btn ${state.editorMode === EditorMode.EDIT ? 'active' : ''}`}
                  onClick={() => handleEditorModeChange(EditorMode.EDIT)}
                  disabled={isLoading}
                >
                  {getEditorModeLabel(EditorMode.EDIT)}
                </button>
                <button
                  className={`mode-btn ${state.editorMode === EditorMode.PREVIEW ? 'active' : ''}`}
                  onClick={() => handleEditorModeChange(EditorMode.PREVIEW)}
                  disabled={isLoading}
                >
                  {getEditorModeLabel(EditorMode.PREVIEW)}
                </button>
                <button
                  className={`mode-btn ${state.editorMode === EditorMode.SPLIT ? 'active' : ''}`}
                  onClick={() => handleEditorModeChange(EditorMode.SPLIT)}
                  disabled={isLoading}
                >
                  {getEditorModeLabel(EditorMode.SPLIT)}
                </button>
              </div>
            )}
          </div>

          <div className="toolbar-right">
            {/* 编辑器特定工具 */}
            {state.editorType === EditorType.MARKDOWN && (
              <>
                <button className="tool-btn" title="加粗">B</button>
                <button className="tool-btn" title="斜体">I</button>
                <button className="tool-btn" title="链接">🔗</button>
                <button className="tool-btn" title="图片">🖼️</button>
              </>
            )}

            {state.editorType === EditorType.RICH_TEXT && (
              <>
                <button className="tool-btn" title="段落">¶</button>
                <button className="tool-btn" title="标题">H</button>
                <button className="tool-btn" title="列表">•</button>
                <button className="tool-btn" title="代码">{`</>`}</button>
              </>
            )}

            {state.editorType === EditorType.CANVAS && (
              <>
                <button className="tool-btn" title="添加文本节点">T</button>
                <button className="tool-btn" title="添加图片节点">🖼️</button>
                <button className="tool-btn" title="连接节点">→</button>
                <button className="tool-btn" title="删除">🗑️</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 编辑器容器 */}
      <div className="editor-container">
        {isLoading && (
          <div className="editor-loading">
            <div className="loading-spinner"></div>
            <span>正在加载编辑器...</span>
          </div>
        )}
        
        <div
          ref={editorRef}
          className={`editor-content editor-${state.editorType}`}
          style={{ display: isLoading ? 'none' : 'block' }}
        />
      </div>

      {/* 状态栏 */}
      {showStatusBar && (
        <div className="editor-status-bar">
          <div className="status-left">
            <span className="status-item">
              类型: {getEditorTypeLabel(state.editorType)}
            </span>
            {state.editorType === EditorType.MARKDOWN && (
              <span className="status-item">
                模式: {getEditorModeLabel(state.editorMode)}
              </span>
            )}
            <span className="status-item">
              字符数: {state.content.length}
            </span>
          </div>
          <div className="status-right">
            <span className="status-item">
              行: {state.cursorPosition.line}
            </span>
            <span className="status-item">
              列: {state.cursorPosition.column}
            </span>
          </div>
        </div>
      )}

      <style jsx>{`
        .editor-core-v2 {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--editor-bg, #ffffff);
          color: var(--editor-text, #000000);
        }

        .editor-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          border-bottom: 1px solid var(--border-color, #e0e0e0);
          background: var(--toolbar-bg, #f8f9fa);
        }

        .toolbar-left,
        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .editor-type-selector select {
          padding: 4px 8px;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 4px;
          background: var(--input-bg, #ffffff);
          color: var(--input-text, #000000);
        }

        .editor-mode-selector {
          display: flex;
          gap: 4px;
        }

        .mode-btn {
          padding: 4px 8px;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 4px;
          background: var(--button-bg, #ffffff);
          color: var(--button-text, #000000);
          cursor: pointer;
          transition: all 0.2s;
        }

        .mode-btn:hover {
          background: var(--button-hover-bg, #f0f0f0);
        }

        .mode-btn.active {
          background: var(--button-active-bg, #007acc);
          color: var(--button-active-text, #ffffff);
          border-color: var(--button-active-bg, #007acc);
        }

        .tool-btn {
          padding: 4px 8px;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 4px;
          background: var(--button-bg, #ffffff);
          color: var(--button-text, #000000);
          cursor: pointer;
          transition: all 0.2s;
        }

        .tool-btn:hover {
          background: var(--button-hover-bg, #f0f0f0);
        }

        .editor-container {
          flex: 1;
          position: relative;
          overflow: hidden;
        }

        .editor-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary, #666666);
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--border-color, #e0e0e0);
          border-top: 2px solid var(--primary-color, #007acc);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .editor-content {
          width: 100%;
          height: 100%;
        }

        .editor-markdown {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }

        .editor-rich-text {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .editor-canvas {
          background: var(--canvas-bg, #f8f9fa);
        }

        .editor-status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 16px;
          border-top: 1px solid var(--border-color, #e0e0e0);
          background: var(--statusbar-bg, #f8f9fa);
          font-size: 12px;
          color: var(--text-secondary, #666666);
        }

        .status-left,
        .status-right {
          display: flex;
          gap: 16px;
        }

        .status-item {
          white-space: nowrap;
        }
      `}</style>
    </div>
  )
} 
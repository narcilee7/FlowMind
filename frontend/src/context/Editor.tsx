import React from 'react'
import { 
  EditorActionType,
  EditorContextValue, 
  EditorPlugin, 
  EditorProviderProps, 
  PositionSection,
  SelectionRange,
  EditorType,
  EditorMode,
  ScrollPosition,
  Viewport,
  MarkdownEditorState,
  RichTextEditorState,
  CanvasEditorState
} from '@/components/Editor/types'
import editorReducer, { initialState } from '@/components/Editor/reducer'

// 创建上下文
const EditorContext = React.createContext<EditorContextValue | null>(null)

export const EditorProvider: React.FC<EditorProviderProps> = ({
  children,
  initialContent = '',
  initialLanguage = 'markdown',
  initialTheme = 'flowmind-dark',
  initialEditorType = EditorType.MARKDOWN,
  initialEditorMode = EditorMode.EDIT
}) => {
  const [state, dispatch] = React.useReducer(editorReducer, {
    ...initialState,
    content: initialContent,
    language: initialLanguage,
    theme: initialTheme,
    editorType: initialEditorType,
    editorMode: initialEditorMode
  }) 

  // 插件管理
  const plugins = React.useRef<Map<string, EditorPlugin>>(new Map())

  // 事件系统
  const eventListeners = React.useRef<Map<string, Set<Function>>>(new Map())

  // 编辑器操作
  const setContent = React.useCallback((content: string) => {
    dispatch({ type: EditorActionType.SET_CONTENT, payload: content })
  }, [])

  const getContent = React.useCallback(() => {
    return state.content
  }, [state.content])

  const insertText = React.useCallback((text: string, position?: PositionSection) => {
    dispatch({ type: EditorActionType.INSERT_TEXT, payload: { text, position } })
  }, [])

  const replaceSelection = React.useCallback((text: string) => {
    dispatch({ type: EditorActionType.REPLACE_SELECTION, payload: text })
  }, [])

  const getSelection = React.useCallback(() => {
    return state.selection
  }, [])
  const setSelection = React.useCallback((selection: string) => {
    dispatch({ type: EditorActionType.SET_SELECTION, payload: selection })
  }, [])

  const getSelectionRange = React.useCallback(() => {
    return state.selectionRange
  }, [])

  const setSelectionRange = React.useCallback((selectionRange: SelectionRange) => {
    dispatch({ type: EditorActionType.SET_SELECTION_RANGE, payload: selectionRange })
  }, [])

  const getCursorPosition = React.useCallback(() => {
    return state.cursorPosition
  }, [])

  const setCursorPosition = React.useCallback((cursorPosition: PositionSection) => {
    dispatch({ type: EditorActionType.SET_CURSOR_POSITION, payload: cursorPosition })
  }, [])

  const setScrollPosition = React.useCallback((scrollPosition: ScrollPosition) => {
    dispatch({ type: EditorActionType.SET_SCROLL_POSITION, payload: scrollPosition })
  }, [])

  const getScrollPosition = React.useCallback(() => {
    return state.scrollPosition
  }, [])

  const getViewport = React.useCallback(() => {
    return state.viewport
  }, [])
  const setViewport = React.useCallback((viewport: Viewport) => {
    dispatch({ type: EditorActionType.SET_VIEWPORT, payload: viewport })
  }, [])

  const getMarkdownState = React.useCallback(() => {
    return state.markdownState || null
  }, [])
  const setMarkdownState = React.useCallback((markdownState: MarkdownEditorState) => {
    dispatch({ type: EditorActionType.SET_MARKDOWN_STATE, payload: markdownState })
  }, [])

  const getRichTextState = React.useCallback(() => {
    return state.richTextState || null
  }, [])
  const setRichTextState = React.useCallback((richTextState: RichTextEditorState) => {
    dispatch({ type: EditorActionType.SET_RICH_TEXT_STATE, payload: richTextState })
  }, [])

  const getCanvasState = React.useCallback(() => {
    return state.canvasState || null
  }, [])
  const setCanvasState = React.useCallback((canvasState: CanvasEditorState) => {
    dispatch({ type: EditorActionType.SET_CANVAS_STATE, payload: canvasState })
  }, [])

  const switchEditorType = React.useCallback(() => {
    dispatch({ type: EditorActionType.SET_EDITOR_TYPE, payload: state.editorType })
  }, [])

  const switchEditorMode = React.useCallback(() => {
    dispatch({ type: EditorActionType.SET_EDITOR_MODE, payload: state.editorMode })
  }, [])

  const scrollToLine = React.useCallback((line: number) => {
    const scrollPosition = getScrollPosition()
    setScrollPosition({ ...scrollPosition, scrollTop: line })
  }, [])

  // 插件系统
  const registerPlugin = React.useCallback((plugin: EditorPlugin) => {
    plugins.current.set(plugin.id, plugin)
  }, [])

  const unregisterPlugin = React.useCallback((pluginId: string) => {
    const plugin = plugins.current.get(pluginId)
    if (plugin) {
      plugin.deactivate()
      plugins.current.delete(pluginId)
    }
  }, [])

  const getPlugin = React.useCallback((pluginId: string) => {
    return plugins.current.get(pluginId)
  }, [])

  // 发布订阅
  const subscribe = React.useCallback((event: string, callback: Function) => {
    if (!eventListeners.current.has(event)) {
      eventListeners.current.set(event, new Set())
    }
    eventListeners.current.get(event)!.add(callback)

    return () => {
      eventListeners.current.get(event)!.delete(callback)
    }
  }, [])

  const emit = React.useCallback((event: string, data?: any) => {
    const listeners = eventListeners.current.get(event)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }, [])

  const contextValue: EditorContextValue = {
    state,
    dispatch,
    setContent,
    getContent,
    insertText,
    replaceSelection,
    getSelection,
    setSelection,
    getSelectionRange,
    setSelectionRange,
    getCursorPosition,
    setCursorPosition,
    getScrollPosition,
    setScrollPosition,
    scrollToLine,
    getViewport,
    setViewport,
    getMarkdownState,
    setMarkdownState,
    getRichTextState,
    setRichTextState,
    getCanvasState,
    setCanvasState,
    switchEditorType,
    switchEditorMode,
    registerPlugin,
    unregisterPlugin,
    getPlugin,
    subscribe,
    emit
  }

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  )
}

// Hook
export const useEditor = () => {
  const context = React.useContext(EditorContext)
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider')
  }
  return context
}


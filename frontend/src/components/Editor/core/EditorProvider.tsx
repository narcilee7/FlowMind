import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { 
  EditorActionType,
   EditorContextValue, 
   EditorPlugin, 
   EditorProviderProps, 
   PositionSection,
   SelectionSection
} from '../types'
import editorReducer, { initialState } from '../reducer'

// 创建上下文
const EditorContext = createContext<EditorContextValue | null>(null)

export const EditorProvider: React.FC<EditorProviderProps> = ({
  children,
  initialContent = '',
  initialLanguage = 'markdown',
  initialTheme = 'flowmind-dark'
}) => {
  const [state, dispatch] = useReducer(editorReducer, {
    ...initialState,
    content: initialContent,
    language: initialLanguage,
    theme: initialTheme
  })

  // 插件管理
  const plugins = React.useRef<Map<string, EditorPlugin>>(new Map())
  
  // 事件系统
  const eventListeners = React.useRef<Map<string, Set<Function>>>(new Map())

  // 编辑器操作方法
  const setContent = useCallback((content: string) => {
    dispatch({ type: EditorActionType.SET_CONTENT, payload: content })
  }, [])

  const getContent = useCallback(() => {
    return state.content
  }, [state.content])

  const insertText = useCallback((text: string, position?: PositionSection) => {
    // 这里需要与具体的编辑器实例交互
    // 暂时通过事件系统通知
    emit('insertText', { text, position })
  }, [])

  const replaceSelection = useCallback((text: string) => {
    emit('replaceSelection', { text })
  }, [])

  const getSelection = useCallback(() => {
    // 通过事件系统获取选择内容
    return ''
  }, [])

  const setSelection = useCallback((start: PositionSection, end: PositionSection) => {
    dispatch({ type: EditorActionType.SET_SELECTION, payload: { start, end } as SelectionSection })
  }, [])

  // 插件系统
  const registerPlugin = useCallback((plugin: EditorPlugin) => {
    plugins.current.set(plugin.id, plugin)
  }, [])

  const unregisterPlugin = useCallback((pluginId: string) => {
    const plugin = plugins.current.get(pluginId)
    if (plugin) {
      plugin.deactivate()
      plugins.current.delete(pluginId)
    }
  }, [])

  const getPlugin = useCallback((pluginId: string) => {
    return plugins.current.get(pluginId)
  }, [])

  // 事件系统
  const subscribe = useCallback((event: string, callback: Function) => {
    if (!eventListeners.current.has(event)) {
      eventListeners.current.set(event, new Set())
    }
    eventListeners.current.get(event)!.add(callback)
    
    // 返回取消订阅函数
    return () => {
      const listeners = eventListeners.current.get(event)
      if (listeners) {
        listeners.delete(callback)
      }
    }
  }, [])

  const emit = useCallback((event: string, data?: any) => {
    const listeners = eventListeners.current.get(event)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }, [])

  // 上下文值
  const contextValue: EditorContextValue = {
    state,
    dispatch,
    setContent,
    getContent,
    insertText,
    replaceSelection,
    getSelection,
    setSelection,
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
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider')
  }
  return context
}

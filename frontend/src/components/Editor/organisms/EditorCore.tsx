import React, { useEffect, useRef, useCallback } from 'react'
import { useEditor } from '../core/EditorProvider'
import { EditorRegistry } from '../core/EditorAdapter'
import { MarkdownPlugin } from '../plugins/MarkdownPlugin'
import { AIAssistantPlugin } from '../plugins/AIAssistantPlugin'
import { useAppStore } from '@/stores/app-store'

interface EditorCoreProps {
  className?: string
  adapter?: string
  plugins?: string[]
}

export const EditorCore: React.FC<EditorCoreProps> = ({
  className,
  adapter = 'monaco',
  plugins = ['markdown', 'ai-assistant']
}) => {
  const { state, dispatch, registerPlugin, unregisterPlugin, subscribe, emit } = useEditor()
  const { editorSettings, theme: appTheme } = useAppStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const adapterInstanceRef = useRef<any>(null)
  const pluginInstancesRef = useRef<Map<string, any>>(new Map())

  // 初始化编辑器适配器
  useEffect(() => {
    if (!containerRef.current) return

    const factory = EditorRegistry.get(adapter)
    if (!factory) {
      console.error(`Editor adapter '${adapter}' not found`)
      return
    }

    const adapterInstance = factory.createAdapter()
    adapterInstanceRef.current = adapterInstance

    // 配置编辑器选项
    const options = {
      value: state.content,
      language: state.language,
      theme: appTheme === 'dark' ? 'flowmind-dark' : 'flowmind-light',
      readOnly: state.isReadOnly,
      fontSize: editorSettings.fontSize,
      fontFamily: editorSettings.fontFamily,
      lineHeight: editorSettings.lineHeight,
      wordWrap: editorSettings.wordWrap ? 'on' : 'off',
      wordWrapColumn: 80,
      minimap: { enabled: false },
      lineNumbers: 'on',
      folding: true,
      autoSave: true,
      autoSaveDelay: 1000,
      contextmenu: true,
      mouseWheelZoom: true,
      quickSuggestions: true,
      suggestOnTriggerCharacters: true,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      padding: { top: 16, bottom: 16 }
    }

    // 创建编辑器实例
    adapterInstance.create(containerRef.current, options)

    // 绑定编辑器事件
    adapterInstance.on('change', (content: string) => {
      dispatch({ type: 'SET_CONTENT', payload: content })
    })

    adapterInstance.on('cursorPositionChanged', (position: any) => {
      dispatch({ type: 'SET_CURSOR_POSITION', payload: position })
    })

    adapterInstance.on('selectionChanged', (selection: any) => {
      dispatch({ type: 'SET_SELECTION', payload: selection })
    })

    adapterInstance.on('scrollChanged', (scrollPosition: any) => {
      dispatch({ type: 'SET_SCROLL_POSITION', payload: scrollPosition })
    })

    adapterInstance.on('focus', () => {
      emit('editorFocused')
    })

    adapterInstance.on('blur', () => {
      emit('editorBlurred')
    })

    // 清理函数
    return () => {
      if (adapterInstanceRef.current) {
        adapterInstanceRef.current.destroy()
        adapterInstanceRef.current = null
      }
    }
  }, [adapter, appTheme])

  // 注册插件
  useEffect(() => {
    const pluginMap = {
      'markdown': MarkdownPlugin,
      'ai-assistant': AIAssistantPlugin
    }

    plugins.forEach(pluginId => {
      const PluginClass = pluginMap[pluginId as keyof typeof pluginMap]
      if (PluginClass) {
        const pluginInstance = new PluginClass()
        pluginInstancesRef.current.set(pluginId, pluginInstance)
        registerPlugin(pluginInstance)
      }
    })

    // 清理函数
    return () => {
      plugins.forEach(pluginId => {
        const pluginInstance = pluginInstancesRef.current.get(pluginId)
        if (pluginInstance) {
          unregisterPlugin(pluginId)
          pluginInstancesRef.current.delete(pluginId)
        }
      })
    }
  }, [plugins, registerPlugin, unregisterPlugin])

  // 监听编辑器设置变化
  useEffect(() => {
    if (adapterInstanceRef.current) {
      adapterInstanceRef.current.updateOptions({
        fontSize: editorSettings.fontSize,
        fontFamily: editorSettings.fontFamily,
        lineHeight: editorSettings.lineHeight,
        wordWrap: editorSettings.wordWrap ? 'on' : 'off',
        theme: appTheme === 'dark' ? 'flowmind-dark' : 'flowmind-light',
      })
    }
  }, [editorSettings, appTheme])

  // 同步内容变化
  useEffect(() => {
    if (adapterInstanceRef.current) {
      const currentValue = adapterInstanceRef.current.getValue()
      if (currentValue !== state.content) {
        adapterInstanceRef.current.setValue(state.content)
      }
    }
  }, [state.content])

  // 处理命令注册
  useEffect(() => {
    const unsubscribe = subscribe('registerCommand', ({ id, handler }) => {
      if (adapterInstanceRef.current) {
        adapterInstanceRef.current.addCommand(id, handler)
      }
    })

    return unsubscribe
  }, [subscribe])

  // 处理快捷键注册
  useEffect(() => {
    const unsubscribe = subscribe('registerKeybinding', (binding) => {
      if (adapterInstanceRef.current) {
        // 这里需要根据具体的适配器实现来注册快捷键
        console.log('Registering keybinding:', binding)
      }
    })

    return unsubscribe
  }, [subscribe])

  // 处理错误显示
  useEffect(() => {
    const unsubscribe = subscribe('showError', (message: string) => {
      // 这里可以集成到应用的错误处理系统
      console.error('Editor error:', message)
      // 可以显示toast或其他错误提示
    })

    return unsubscribe
  }, [subscribe])

  // 暴露编辑器方法给上下文
  const setContent = useCallback((content: string) => {
    if (adapterInstanceRef.current) {
      adapterInstanceRef.current.setValue(content)
    }
  }, [])

  const getContent = useCallback(() => {
    if (adapterInstanceRef.current) {
      return adapterInstanceRef.current.getValue()
    }
    return ''
  }, [])

  const insertText = useCallback((text: string, position?: any) => {
    if (adapterInstanceRef.current) {
      adapterInstanceRef.current.insertText(text, position)
    }
  }, [])

  const replaceSelection = useCallback((text: string) => {
    if (adapterInstanceRef.current) {
      adapterInstanceRef.current.replaceSelection(text)
    }
  }, [])

  const getSelection = useCallback(() => {
    if (adapterInstanceRef.current) {
      return adapterInstanceRef.current.getSelection()
    }
    return ''
  }, [])

  const setSelection = useCallback((start: any, end: any) => {
    if (adapterInstanceRef.current) {
      adapterInstanceRef.current.setSelection(start, end)
    }
  }, [])

  // 更新上下文中的编辑器方法
  useEffect(() => {
    // 这里需要更新EditorProvider中的方法引用
    // 由于架构限制，这里暂时通过事件系统来处理
    emit('updateEditorMethods', {
      setContent,
      getContent,
      insertText,
      replaceSelection,
      getSelection,
      setSelection
    })
  }, [setContent, getContent, insertText, replaceSelection, getSelection, setSelection, emit])

  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{ height: '100%', width: '100%' }}
    />
  )
} 
import React, { useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor'
import { useAppStore } from '@/stores/app-store'

interface MonacoEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  theme?: string
  className?: string
}

// 配置Monaco编辑器
const configureMonaco = () => {
  // 配置Markdown语言
  monaco.languages.register({ id: 'markdown' })
  
  // 配置Markdown语法高亮
  monaco.languages.setMonarchTokensProvider('markdown', {
    defaultToken: '',
    tokenizer: {
      root: [
        // 标题
        [/^(#{1,6})\s+(.+)$/, 'heading'],
        // 粗体
        [/\*\*(.+?)\*\*/, 'strong'],
        // 斜体
        [/\*(.+?)\*/, 'emphasis'],
        // 代码块
        [/```[\s\S]*?```/, 'code'],
        // 行内代码
        [/`([^`]+)`/, 'code'],
        // 链接
        [/\[([^\]]+)\]\(([^)]+)\)/, 'link'],
        // 列表
        [/^(\s*)([-*+]|\d+\.)\s/, 'list'],
        // 引用
        [/^>\s+(.+)$/, 'quote'],
        // 分割线
        [/^---+$/, 'hr'],
        // 表格
        [/\|(.+)\|/, 'table'],
      ]
    }
  })

  // 配置编辑器主题
  monaco.editor.defineTheme('flowmind-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'heading', foreground: '569CD6', fontStyle: 'bold' },
      { token: 'strong', foreground: 'DCDCAA', fontStyle: 'bold' },
      { token: 'emphasis', foreground: 'DCDCAA', fontStyle: 'italic' },
      { token: 'code', foreground: '4EC9B0', background: '1E1E1E' },
      { token: 'link', foreground: '4EC9B0' },
      { token: 'list', foreground: 'C586C0' },
      { token: 'quote', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'hr', foreground: '569CD6' },
      { token: 'table', foreground: '9CDCFE' },
    ],
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'editor.lineHighlightBackground': '#2A2A2A',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#3A3D41',
    }
  })

  monaco.editor.defineTheme('flowmind-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'heading', foreground: '0000FF', fontStyle: 'bold' },
      { token: 'strong', foreground: '000000', fontStyle: 'bold' },
      { token: 'emphasis', foreground: '000000', fontStyle: 'italic' },
      { token: 'code', foreground: 'A31515', background: 'F3F3F3' },
      { token: 'link', foreground: '0000FF' },
      { token: 'list', foreground: '795E26' },
      { token: 'quote', foreground: '008000', fontStyle: 'italic' },
      { token: 'hr', foreground: '0000FF' },
      { token: 'table', foreground: '001080' },
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#000000',
      'editor.lineHighlightBackground': '#F7F7F7',
      'editor.selectionBackground': '#ADD6FF',
      'editor.inactiveSelectionBackground': '#E5EBF1',
    }
  })
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language = 'markdown',
  theme = 'flowmind-dark',
  className
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const editorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const { editorSettings, theme: appTheme } = useAppStore()

  useEffect(() => {
    // 配置Monaco编辑器
    configureMonaco()
  }, [])

  useEffect(() => {
    if (!editorRef.current) return

    // 创建编辑器实例
    const editor = monaco.editor.create(editorRef.current, {
      value,
      language,
      theme: appTheme === 'dark' ? 'flowmind-dark' : 'flowmind-light',
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: editorSettings.wordWrap ? 'on' : 'off',
      fontSize: editorSettings.fontSize,
      fontFamily: editorSettings.fontFamily,
      lineHeight: editorSettings.lineHeight * 16, // Monaco使用像素值
      padding: { top: 16, bottom: 16 },
      renderWhitespace: 'none',
      folding: true,
      lineNumbers: 'on',
      glyphMargin: true,
      foldingStrategy: 'indentation',
      showFoldingControls: 'always',
      selectOnLineNumbers: true,
      roundedSelection: false,
      readOnly: false,
      cursorStyle: 'line',
      contextmenu: true,
      mouseWheelZoom: true,
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
      wordBasedSuggestions: true,
      parameterHints: {
        enabled: true
      },
      hover: {
        enabled: true
      },
      links: true,
      colorDecorators: true,
      lightbulb: {
        enabled: true
      },
      // Markdown特定配置
      wordWrapColumn: 80,
      wordWrapMinified: true,
      wrappingIndent: 'indent',
      // 自动保存
      autoSave: 'afterDelay',
      autoSaveDelay: 1000,
    })

    // 监听内容变化
    editor.onDidChangeModelContent(() => {
      const newValue = editor.getValue()
      onChange(newValue)
    })

    // 添加快捷键
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // 保存快捷键
      console.log('保存文件')
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      // 加粗快捷键
      const selection = editor.getSelection()
      if (selection) {
        const text = editor.getModel()?.getValueInRange(selection) || ''
        const newText = `**${text}**`
        editor.executeEdits('bold', [{
          range: selection,
          text: newText
        }])
      }
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
      // 斜体快捷键
      const selection = editor.getSelection()
      if (selection) {
        const text = editor.getModel()?.getValueInRange(selection) || ''
        const newText = `*${text}*`
        editor.executeEdits('italic', [{
          range: selection,
          text: newText
        }])
      }
    })

    editorInstanceRef.current = editor

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.dispose()
        editorInstanceRef.current = null
      }
    }
  }, [language, appTheme])

  // 更新编辑器设置
  useEffect(() => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.updateOptions({
        fontSize: editorSettings.fontSize,
        fontFamily: editorSettings.fontFamily,
        lineHeight: editorSettings.lineHeight * 16,
        wordWrap: editorSettings.wordWrap ? 'on' : 'off',
        theme: appTheme === 'dark' ? 'flowmind-dark' : 'flowmind-light',
      })
    }
  }, [editorSettings, appTheme])

  // 同步值
  useEffect(() => {
    if (editorInstanceRef.current) {
      const currentValue = editorInstanceRef.current.getValue()
      if (currentValue !== value) {
        editorInstanceRef.current.setValue(value)
      }
    }
  }, [value])

  return (
    <div 
      ref={editorRef} 
      className={className}
      style={{ height: '100%', width: '100%' }}
    />
  )
} 
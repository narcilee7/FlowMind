'use client'

import React, { useRef, useEffect, useState } from 'react'
import { RichTextViewAdapter } from '@/components/Editor/adapters/RichTextViewAdapter'
import { SceneTemplate } from '@/components/Editor/types/EditorType'

/**
 * RichText 富文本编辑器演示页面
 * 
 * 功能展示：
 * - 完整的富文本编辑功能
 * - 格式化工具栏
 * - 表格、图片、链接等元素
 * - 实时字数统计
 * - 导出功能
 */
export default function RichTextDemoPage() {
  const editorRef = useRef<HTMLDivElement>(null)
  const adapterRef = useRef<RichTextViewAdapter | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [stats, setStats] = useState({
    characters: 0,
    words: 0,
    paragraphs: 0,
    headings: 0,
    lists: 0,
    tables: 0,
    images: 0,
    links: 0
  })
  const [formatState, setFormatState] = useState<any>({})

  // 初始化编辑器
  useEffect(() => {
    const initEditor = async () => {
      if (!editorRef.current) return

      try {
        const adapter = new RichTextViewAdapter(SceneTemplate.WRITING)

        await adapter.create(editorRef.current, {
          placeholder: '开始您的写作...',
          enableMarkdown: true,
          enableTables: true,
          enableImages: true,
          enableTaskLists: true,
          enableTypography: true,
          enableTextAlign: true,
          enableTextStyle: true,
          enableHighlight: true,
          autoFocus: true,
          showCharacterCount: true,
          showWordCount: true,
          theme: 'light'
        })

        adapterRef.current = adapter
        setIsReady(true)

        // 监听内容变化
        adapter.on('contentChanged', () => {
          updateStats()
          updateFormatState()
        })

        // 设置初始内容
        const initialHTML = `
                    <h1>欢迎使用 FlowMind 富文本编辑器</h1>
                    <p>这是一个功能完整的富文本编辑器，基于 TipTap 构建。支持以下功能：</p>
                    
                    <h2>文本格式化</h2>
                    <p>支持 <strong>粗体</strong>、<em>斜体</em>、<u>下划线</u>、<s>删除线</s> 和 <code>行内代码</code></p>
                    
                    <h2>列表</h2>
                    <ul>
                        <li>无序列表项 1</li>
                        <li>无序列表项 2</li>
                        <li>无序列表项 3</li>
                    </ul>
                    
                    <ol>
                        <li>有序列表项 1</li>
                        <li>有序列表项 2</li>
                        <li>有序列表项 3</li>
                    </ol>
                    
                    <h2>引用</h2>
                    <blockquote>
                        <p>这是一个引用块，用于突出显示重要内容。</p>
                    </blockquote>
                    
                    <h2>代码块</h2>
                    <pre><code>function hello() {
    console.log("Hello, FlowMind!");
}</code></pre>
                    
                    <p>您可以使用工具栏中的按钮来格式化文本、插入表格、图片等。</p>
                `
        adapter.setHTML(initialHTML)

        console.log('[RichTextDemo] Editor initialized successfully')
      } catch (error) {
        console.error('[RichTextDemo] Failed to initialize editor:', error)
      }
    }

    initEditor()

    return () => {
      if (adapterRef.current) {
        adapterRef.current.destroy()
      }
    }
  }, [])

  // 更新统计信息
  const updateStats = () => {
    if (adapterRef.current) {
      const newStats = adapterRef.current.getDocumentStats()
      setStats(newStats)
    }
  }

  // 更新格式状态
  const updateFormatState = () => {
    if (adapterRef.current) {
      const newFormatState = adapterRef.current.getFormatState()
      setFormatState(newFormatState)
    }
  }

  // 格式化按钮处理函数
  const handleFormat = (action: string) => {
    if (!adapterRef.current) return

    switch (action) {
      case 'bold':
        adapterRef.current.toggleBold()
        break
      case 'italic':
        adapterRef.current.toggleItalic()
        break
      case 'underline':
        adapterRef.current.toggleUnderline()
        break
      case 'strike':
        adapterRef.current.toggleStrike()
        break
      case 'code':
        adapterRef.current.toggleCode()
        break
      case 'h1':
        adapterRef.current.setHeading(1)
        break
      case 'h2':
        adapterRef.current.setHeading(2)
        break
      case 'h3':
        adapterRef.current.setHeading(3)
        break
      case 'paragraph':
        adapterRef.current.setParagraph()
        break
      case 'bulletList':
        adapterRef.current.toggleBulletList()
        break
      case 'orderedList':
        adapterRef.current.toggleOrderedList()
        break
      case 'blockquote':
        adapterRef.current.toggleBlockquote()
        break
      case 'codeBlock':
        adapterRef.current.setCodeBlock()
        break
      case 'horizontalRule':
        adapterRef.current.setHorizontalRule()
        break
      case 'table':
        adapterRef.current.insertTable(3, 3, true)
        break
      case 'undo':
        adapterRef.current.undo()
        break
      case 'redo':
        adapterRef.current.redo()
        break
    }

    updateFormatState()
  }

  // 导出功能
  const handleExport = (format: string) => {
    if (!adapterRef.current) return

    switch (format) {
      case 'html':
        const html = adapterRef.current.exportToHTML()
        downloadFile(html, 'document.html', 'text/html')
        break
      case 'markdown':
        const markdown = adapterRef.current.exportToMarkdown()
        downloadFile(markdown, 'document.md', 'text/markdown')
        break
      case 'text':
        const text = adapterRef.current.getText()
        downloadFile(text, 'document.txt', 'text/plain')
        break
    }
  }

  // 下载文件
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">
          FlowMind 富文本编辑器演示
        </h1>

        {/* 工具栏 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {/* 基础格式化 */}
            <div className="flex gap-1 border-r border-gray-200 pr-2">
              <button
                onClick={() => handleFormat('bold')}
                className={`px-3 py-1 rounded text-sm font-medium ${formatState.isBold ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                disabled={!isReady}
              >
                <strong>B</strong>
              </button>
              <button
                onClick={() => handleFormat('italic')}
                className={`px-3 py-1 rounded text-sm ${formatState.isItalic ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                disabled={!isReady}
              >
                <em>I</em>
              </button>
              <button
                onClick={() => handleFormat('underline')}
                className={`px-3 py-1 rounded text-sm ${formatState.isUnderline ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                disabled={!isReady}
              >
                <u>U</u>
              </button>
              <button
                onClick={() => handleFormat('strike')}
                className={`px-3 py-1 rounded text-sm ${formatState.isStrike ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                disabled={!isReady}
              >
                <s>S</s>
              </button>
            </div>

            {/* 标题和段落 */}
            <div className="flex gap-1 border-r border-gray-200 pr-2">
              <button
                onClick={() => handleFormat('h1')}
                className={`px-3 py-1 rounded text-sm ${formatState.heading === 1 ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                disabled={!isReady}
              >
                H1
              </button>
              <button
                onClick={() => handleFormat('h2')}
                className={`px-3 py-1 rounded text-sm ${formatState.heading === 2 ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                disabled={!isReady}
              >
                H2
              </button>
              <button
                onClick={() => handleFormat('h3')}
                className={`px-3 py-1 rounded text-sm ${formatState.heading === 3 ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                disabled={!isReady}
              >
                H3
              </button>
              <button
                onClick={() => handleFormat('paragraph')}
                className="px-3 py-1 rounded text-sm hover:bg-gray-100"
                disabled={!isReady}
              >
                P
              </button>
            </div>

            {/* 列表和其他 */}
            <div className="flex gap-1 border-r border-gray-200 pr-2">
              <button
                onClick={() => handleFormat('bulletList')}
                className={`px-3 py-1 rounded text-sm ${formatState.isBulletList ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                disabled={!isReady}
              >
                • 列表
              </button>
              <button
                onClick={() => handleFormat('orderedList')}
                className={`px-3 py-1 rounded text-sm ${formatState.isOrderedList ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                disabled={!isReady}
              >
                1. 列表
              </button>
              <button
                onClick={() => handleFormat('blockquote')}
                className={`px-3 py-1 rounded text-sm ${formatState.isBlockquote ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                disabled={!isReady}
              >
                引用
              </button>
            </div>

            {/* 插入元素 */}
            <div className="flex gap-1 border-r border-gray-200 pr-2">
              <button
                onClick={() => handleFormat('table')}
                className="px-3 py-1 rounded text-sm hover:bg-gray-100"
                disabled={!isReady}
              >
                表格
              </button>
              <button
                onClick={() => handleFormat('codeBlock')}
                className={`px-3 py-1 rounded text-sm ${formatState.isCodeBlock ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                disabled={!isReady}
              >
                代码
              </button>
              <button
                onClick={() => handleFormat('horizontalRule')}
                className="px-3 py-1 rounded text-sm hover:bg-gray-100"
                disabled={!isReady}
              >
                分割线
              </button>
            </div>

            {/* 撤销/重做 */}
            <div className="flex gap-1">
              <button
                onClick={() => handleFormat('undo')}
                className="px-3 py-1 rounded text-sm hover:bg-gray-100"
                disabled={!isReady}
              >
                撤销
              </button>
              <button
                onClick={() => handleFormat('redo')}
                className="px-3 py-1 rounded text-sm hover:bg-gray-100"
                disabled={!isReady}
              >
                重做
              </button>
            </div>
          </div>

          {/* 导出按钮 */}
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('html')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={!isReady}
            >
              导出 HTML
            </button>
            <button
              onClick={() => handleExport('markdown')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={!isReady}
            >
              导出 Markdown
            </button>
            <button
              onClick={() => handleExport('text')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              disabled={!isReady}
            >
              导出纯文本
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* 编辑器区域 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div
                ref={editorRef}
                className="min-h-[600px] p-6"
                style={{
                  fontSize: '16px',
                  lineHeight: '1.6',
                  color: '#374151'
                }}
              />
            </div>
          </div>

          {/* 侧边栏 - 统计信息 */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">文档统计</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>字符数:</span>
                  <span className="font-medium">{stats.characters}</span>
                </div>
                <div className="flex justify-between">
                  <span>词数:</span>
                  <span className="font-medium">{stats.words}</span>
                </div>
                <div className="flex justify-between">
                  <span>段落:</span>
                  <span className="font-medium">{stats.paragraphs}</span>
                </div>
                <div className="flex justify-between">
                  <span>标题:</span>
                  <span className="font-medium">{stats.headings}</span>
                </div>
                <div className="flex justify-between">
                  <span>列表:</span>
                  <span className="font-medium">{stats.lists}</span>
                </div>
                <div className="flex justify-between">
                  <span>表格:</span>
                  <span className="font-medium">{stats.tables}</span>
                </div>
                <div className="flex justify-between">
                  <span>图片:</span>
                  <span className="font-medium">{stats.images}</span>
                </div>
                <div className="flex justify-between">
                  <span>链接:</span>
                  <span className="font-medium">{stats.links}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">使用说明</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• 使用工具栏按钮进行格式化</p>
                <p>• 支持 Markdown 快捷键</p>
                <p>• 可以插入表格、图片和链接</p>
                <p>• 支持撤销/重做操作</p>
                <p>• 可导出多种格式</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

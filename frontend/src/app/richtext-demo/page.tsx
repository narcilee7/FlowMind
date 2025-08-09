'use client'

import React, { useRef, useEffect, useState } from 'react'
import { EditorKit } from '@/components/Editor/EditorKit'
import { EditorType, SceneTemplate } from '@/components/Editor/types/EditorType'
import { EditorKitHandle } from '@/components/Editor/types/EditorKit'
import { DocumentAST } from '@/components/Editor/types/EditorAST'

/**
 * 富文本编辑器演示页面 - 通过EditorKit统一入口
 * 
 * 功能展示：
 * - 通过EditorKit统一管理编辑器实例
 * - 支持智能场景检测和编辑器切换
 * - 完整的富文本编辑功能
 * - 格式化工具栏
 * - 表格、图片、链接等元素
 * - 实时字数统计
 * - 导出功能
 * - AI功能集成
 */
export default function RichTextDemoPage() {
  const editorKitRef = useRef<EditorKitHandle>(null)
  const [isReady, setIsReady] = useState(false)
  const [currentContent, setCurrentContent] = useState<DocumentAST | null>(null)
  const [currentEditorType, setCurrentEditorType] = useState<EditorType>(EditorType.RICH_TEXT)
  const [currentScene, setCurrentScene] = useState<SceneTemplate>(SceneTemplate.WRITING)
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

  // 计算统计信息
  const updateStats = (content: DocumentAST) => {
    const textContent = extractTextContent(content)
    const words = textContent.split(/\s+/).filter(word => word.length > 0).length
    const characters = textContent.length

    // 这里可以添加更复杂的统计逻辑
    setStats({
      characters,
      words,
      paragraphs: Math.max(1, textContent.split('\n').length),
      headings: (textContent.match(/^#/gm) || []).length,
      lists: (textContent.match(/^[-*+]|^\d+\./gm) || []).length,
      tables: (textContent.match(/\|/g) || []).length / 4, // 简化的表格统计
      images: (textContent.match(/!\[.*?\]\(.*?\)/g) || []).length,
      links: (textContent.match(/\[.*?\]\(.*?\)/g) || []).length
    })
  }

  // 提取文本内容的辅助函数
  const extractTextContent = (ast: DocumentAST): string => {
    const extractFromNode = (node: any): string => {
      let text = ''
      if (node.content && typeof node.content === 'string') {
        text += node.content
      }
      if (node.children) {
        text += node.children.map(extractFromNode).join(' ')
      }
      return text
    }
    return extractFromNode(ast.root).trim()
  }

  // 格式化按钮处理函数（通过EditorKit API）
  const handleFormat = async (action: string) => {
    if (!editorKitRef.current || !isReady) return

    try {
      const adapterType = editorKitRef.current.getAdapterType()
      if (adapterType === EditorType.RICH_TEXT) {
        // 使用EditorKit的executeCommand API来执行富文本格式化命令
        switch (action) {
          case 'bold':
            await editorKitRef.current.executeCommand('toggleBold')
            break
          case 'italic':
            await editorKitRef.current.executeCommand('toggleItalic')
            break
          case 'underline':
            await editorKitRef.current.executeCommand('toggleUnderline')
            break
          case 'strike':
            await editorKitRef.current.executeCommand('toggleStrike')
            break
          case 'code':
            await editorKitRef.current.executeCommand('toggleCode')
            break
          case 'h1':
            await editorKitRef.current.executeCommand('setHeading', 1)
            break
          case 'h2':
            await editorKitRef.current.executeCommand('setHeading', 2)
            break
          case 'h3':
            await editorKitRef.current.executeCommand('setHeading', 3)
            break
          case 'paragraph':
            await editorKitRef.current.executeCommand('setParagraph')
            break
          case 'bulletList':
            await editorKitRef.current.executeCommand('toggleBulletList')
            break
          case 'orderedList':
            await editorKitRef.current.executeCommand('toggleOrderedList')
            break
          case 'blockquote':
            await editorKitRef.current.executeCommand('toggleBlockquote')
            break
          case 'codeBlock':
            await editorKitRef.current.executeCommand('setCodeBlock')
            break
          case 'horizontalRule':
            await editorKitRef.current.executeCommand('setHorizontalRule')
            break
          case 'table':
            await editorKitRef.current.executeCommand('insertTable', 3, 3, true)
            break
          case 'undo':
            editorKitRef.current.undo()
            break
          case 'redo':
            editorKitRef.current.redo()
            break
          default:
            console.log(`[EditorKit] Unknown format action: ${action}`)
        }
      }
    } catch (error) {
      console.error('[EditorKit] Format operation failed:', error)
    }
  }

  // 导出功能（通过EditorKit API）
  const handleExport = async (format: string) => {
    if (!editorKitRef.current || !isReady) return

    try {
      let content: string
      let filename: string
      let mimeType: string

      switch (format) {
        case 'html':
          content = await editorKitRef.current.exportToHTML()
          filename = 'document.html'
          mimeType = 'text/html'
          break
        case 'markdown':
          content = await editorKitRef.current.exportToMarkdown()
          filename = 'document.md'
          mimeType = 'text/markdown'
          break
        case 'json':
          content = editorKitRef.current.exportToJSON()
          filename = 'document.json'
          mimeType = 'application/json'
          break
        default:
          return
      }

      downloadFile(content, filename, mimeType)
    } catch (error) {
      console.error('[EditorKit] Export failed:', error)
    }
  }

  // 切换编辑器类型
  const switchEditorType = async (type: EditorType) => {
    if (!editorKitRef.current || type === currentEditorType) return

    try {
      await editorKitRef.current.switchEditor(type)
      setCurrentEditorType(type)
    } catch (error) {
      console.error('[EditorKit] Switch editor failed:', error)
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

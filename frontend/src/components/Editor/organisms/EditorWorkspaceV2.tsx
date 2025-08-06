import React, { useState, useMemo } from 'react'
import { cn } from '@/utils/cn'
import { EditorProvider } from '../core/EditorProvider'
import { EditorCore } from './EditorCore'
import { TableOfContents } from '../molecules/TableOfContents'
import { FileTree } from '../molecules/FileTree'
import { EditorToolbar } from '../molecules/EditorToolbar'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'

interface EditorWorkspaceV2Props {
  content: string
  onContentChange: (content: string) => void
  showPreview?: boolean
  showToc?: boolean
  showFileTree?: boolean
  className?: string
  plugins?: string[]
  adapter?: string
}

// 解析Markdown生成目录
const parseTocFromMarkdown = (content: string) => {
  const lines = content.split('\n')
  const tocItems: Array<{ id: string; title: string; level: number }> = []
  
  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const title = match[2].trim()
      const id = `heading-${index}`
      tocItems.push({ id, title, level })
    }
  })
  
  return tocItems
}

// 模拟文件树数据
const mockFileTree = [
  {
    id: '1',
    name: '项目文档',
    type: 'folder' as const,
    path: '/docs',
    children: [
      {
        id: '2',
        name: 'README.md',
        type: 'file' as const,
        path: '/docs/README.md'
      },
      {
        id: '3',
        name: '技术方案.md',
        type: 'file' as const,
        path: '/docs/技术方案.md'
      }
    ]
  },
  {
    id: '4',
    name: '笔记',
    type: 'folder' as const,
    path: '/notes',
    children: [
      {
        id: '5',
        name: '学习笔记.md',
        type: 'file' as const,
        path: '/notes/学习笔记.md'
      }
    ]
  }
]

export const EditorWorkspaceV2: React.FC<EditorWorkspaceV2Props> = ({
  content,
  onContentChange,
  showPreview = false,
  showToc = true,
  showFileTree = true,
  className,
  plugins = ['markdown', 'ai-assistant'],
  adapter = 'monaco'
}) => {
  const [activeHeading, setActiveHeading] = useState<string>()
  const [showPreviewState, setShowPreview] = useState(showPreview)
  const [isLoading, setIsLoading] = useState(false)

  // 解析目录
  const tocItems = useMemo(() => {
    return parseTocFromMarkdown(content)
  }, [content])

  const handleTocItemClick = (id: string) => {
    setActiveHeading(id)
    // TODO: 滚动到对应位置
  }

  const handleFileSelect = (file: any) => {
    console.log('选择文件:', file)
    // TODO: 加载文件内容
  }

  const handleTogglePreview = () => {
    setShowPreview(!showPreviewState)
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // 模拟保存操作
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('保存文件:', content)
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = () => {
    // 创建文件输入元素
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md,.txt,.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const text = e.target?.result as string
          onContentChange(text)
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleExport = () => {
    // 创建下载链接
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleAIAssist = () => {
    console.log('打开AI助手')
    // TODO: 实现AI助手功能
  }

  const handleSettings = () => {
    console.log('打开设置')
    // TODO: 实现设置功能
  }

  return (
    <EditorProvider initialContent={content}>
      <div className={cn('h-full flex flex-col', className)}>
        {/* 工具栏 */}
        <EditorToolbar
          showPreview={showPreviewState}
          onTogglePreview={handleTogglePreview}
          onSave={handleSave}
          onImport={handleImport}
          onExport={handleExport}
          onAIAssist={handleAIAssist}
          onSettings={handleSettings}
          isLoading={isLoading}
        />

        {/* 主工作区 */}
        <div className="flex-1">
          <ResizablePanelGroup direction="horizontal">
            {/* 文件树面板 */}
            {showFileTree && (
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <FileTree
                  files={mockFileTree}
                  currentFile="/docs/README.md"
                  onFileSelect={handleFileSelect}
                  className="h-full"
                />
              </ResizablePanel>
            )}

            {showFileTree && <ResizableHandle />}

            {/* 编辑器主区域 */}
            <ResizablePanel defaultSize={showPreviewState ? 50 : 100}>
              <div className="h-full flex">
                {/* 编辑器 */}
                <div className="flex-1">
                  <EditorCore
                    adapter={adapter}
                    plugins={plugins}
                    className="h-full"
                  />
                </div>

                {/* 目录面板 */}
                {showToc && (
                  <>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
                      <TableOfContents
                        items={tocItems}
                        activeId={activeHeading}
                        onItemClick={handleTocItemClick}
                        className="h-full"
                      />
                    </ResizablePanel>
                  </>
                )}
              </div>
            </ResizablePanel>

            {/* 预览面板 */}
            {showPreviewState && (
              <>
                <ResizableHandle />
                <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                  <div className="h-full p-6 overflow-auto bg-background">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div dangerouslySetInnerHTML={{ 
                        __html: content.replace(/\n/g, '<br>') 
                      }} />
                    </div>
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </div>
    </EditorProvider>
  )
} 
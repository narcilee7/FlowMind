import React, { useState, useMemo } from 'react'
import { cn } from '@/utils/cn'
import { MonacoEditor } from './MonacoEditor'
import { TableOfContents } from '../molecules/TableOfContents'
import { FileTree } from '../molecules/FileTree'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'

interface EditorWorkspaceProps {
  content: string
  onContentChange: (content: string) => void
  showPreview?: boolean
  showToc?: boolean
  showFileTree?: boolean
  className?: string
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

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  content,
  onContentChange,
  showPreview = false,
  showToc = true,
  showFileTree = true,
  className
}) => {
  const [activeHeading, setActiveHeading] = useState<string>()

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

  return (
    <div className={cn('h-full flex', className)}>
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
      <ResizablePanel defaultSize={showPreview ? 50 : 100}>
        <div className="h-full flex">
          {/* 编辑器 */}
          <div className="flex-1">
            <MonacoEditor
              value={content}
              onChange={onContentChange}
              language="markdown"
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
      {showPreview && (
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
    </div>
  )
} 
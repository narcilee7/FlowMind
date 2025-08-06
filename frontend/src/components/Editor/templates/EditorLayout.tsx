import React, { useState } from 'react'
import { EditorToolbar } from '../molecules/EditorToolbar'
import { EditorWorkspace } from '../organisms/EditorWorkspace'
import { useAppStore } from '@/stores/app-store'

interface EditorLayoutProps {
  className?: string
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({ className }) => {
  const { editorSettings } = useAppStore()
  const [content, setContent] = useState(`# 欢迎使用 FlowMind

## 功能特性

- **智能编辑**: 基于Monaco编辑器的强大编辑体验
- **实时预览**: 支持Markdown实时预览
- **目录导航**: 自动生成文档目录
- **文件管理**: 完整的文件树管理功能

## 开始使用

1. 在左侧文件树中选择或创建文件
2. 在编辑器中编写Markdown内容
3. 使用右侧目录快速导航
4. 点击预览按钮查看渲染效果

## 快捷键

- \`Ctrl+S\`: 保存文件
- \`Ctrl+Shift+P\`: 命令面板
- \`Ctrl+B\`: 加粗
- \`Ctrl+I\`: 斜体
- \`Ctrl+K\`: 插入链接

## 代码示例

\`\`\`javascript
function hello() {
  console.log('Hello, FlowMind!');
}
\`\`\`

> 这是一个引用块，用于突出重要信息。

- 列表项 1
- 列表项 2
- 列表项 3

| 表格标题 1 | 表格标题 2 |
|------------|------------|
| 内容 1     | 内容 2     |
| 内容 3     | 内容 4     |
`)

  const [showPreview, setShowPreview] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    // TODO: 实现保存逻辑
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const handleImport = () => {
    // TODO: 实现导入逻辑
    console.log('导入文件')
  }

  const handleExport = () => {
    // TODO: 实现导出逻辑
    console.log('导出文件')
  }

  const handleAIAssist = () => {
    // TODO: 实现AI辅助功能
    console.log('AI辅助功能')
  }

  const handleSettings = () => {
    // TODO: 打开设置面板
    console.log('打开设置')
  }

  return (
    <div className={`h-full flex flex-col bg-background ${className}`}>
      {/* 工具栏 */}
      <EditorToolbar
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview(!showPreview)}
        onSave={handleSave}
        onImport={handleImport}
        onExport={handleExport}
        onAIAssist={handleAIAssist}
        onSettings={handleSettings}
        isLoading={isLoading}
      />

      {/* 编辑器工作区 */}
      <div className="flex-1 overflow-hidden">
        <EditorWorkspace
          content={content}
          onContentChange={setContent}
          showPreview={showPreview}
          showToc={true}
          showFileTree={true}
        />
      </div>
    </div>
  )
} 
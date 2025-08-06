import React, { useState, useRef } from 'react'
import { AIEditor } from './AIEditor'
import { Button } from '@/components/ui/button'
import { 
  Save, 
  Download, 
  Share2, 
  Settings, 
  FileText, 
  Image as ImageIcon,
  Table as TableIcon,
  Code,
  Sparkles,
  Bot,
  Lightbulb,
  Wand2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react'

interface AIEditorWorkspaceProps {
  initialContent?: string
  onContentChange?: (content: string) => void
  className?: string
}

export const AIEditorWorkspace: React.FC<AIEditorWorkspaceProps> = (props) => {
  const {
    initialContent = '',
    onContentChange,
    className = ''
  } = props

  // 内容状态
  const [content, setContent] = useState(initialContent)
  // 侧边栏状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  // 全屏状态
  const [isFullscreen, setIsFullscreen] = useState(false)
  // 当前激活的标签
  const [activeTab, setActiveTab] = useState<'ai' | 'outline' | 'settings'>('ai')
  // 文件输入引用
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 内容变化处理函数
  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    onContentChange?.(newContent)
  }

  // 保存文档处理函数
  const handleSave = () => {
    // 保存文档逻辑
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  // 导出文档处理函数
  const handleExport = (format: 'html' | 'markdown' | 'pdf') => {
    // 导出逻辑
    console.log(`导出为 ${format} 格式`)
  }

  // 分享文档处理函数
  const handleShare = () => {
    // 分享逻辑
    if (navigator.share) {
      navigator.share({
        title: '我的文档',
        text: '查看我创建的文档',
        url: window.location.href,
      })
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href)
    }
  }

  // 文件上传处理函数
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setContent(content)
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className={`ai-editor-workspace ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : 'h-full'}`}>
      {/* 顶部工具栏 */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
            
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              AI编辑器
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
            >
              <Save className="w-4 h-4 mr-1" />
              保存
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleExport('html')}
            >
              <Download className="w-4 h-4 mr-1" />
              导出
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-1" />
              分享
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-full">
        {/* 侧边栏 */}
        {isSidebarOpen && (
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            {/* 侧边栏标签 */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  activeTab === 'ai' 
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-white dark:bg-gray-700' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                onClick={() => setActiveTab('ai')}
              >
                <Bot className="w-4 h-4 inline mr-1" />
                AI助手
              </button>
              <button
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  activeTab === 'outline' 
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-white dark:bg-gray-700' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                onClick={() => setActiveTab('outline')}
              >
                <FileText className="w-4 h-4 inline mr-1" />
                大纲
              </button>
              <button
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  activeTab === 'settings' 
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-white dark:bg-gray-700' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                onClick={() => setActiveTab('settings')}
              >
                <Settings className="w-4 h-4 inline mr-1" />
                设置
              </button>
            </div>

            {/* 侧边栏内容 */}
            <div className="p-4">
              {activeTab === 'ai' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      AI功能
                    </h3>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          // 触发AI内容生成
                          console.log('生成文章大纲')
                        }}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        生成文章大纲
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          console.log('优化文章结构')
                        }}
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        优化文章结构
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          console.log('检查语法错误')
                        }}
                      >
                        <Lightbulb className="w-4 h-4 mr-2" />
                        检查语法错误
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      快速插入
                    </h3>
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          console.log('插入图片')
                        }}
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        插入图片
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          console.log('插入表格')
                        }}
                      >
                        <TableIcon className="w-4 h-4 mr-2" />
                        插入表格
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          console.log('插入代码块')
                        }}
                      >
                        <Code className="w-4 h-4 mr-2" />
                        插入代码块
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      文件操作
                    </h3>
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".html,.htm,.txt,.md"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        导入文件
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'outline' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    文档大纲
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>文档大纲功能正在开发中...</p>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    编辑器设置
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">
                        主题
                      </label>
                      <select className="w-full mt-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700">
                        <option value="light">浅色主题</option>
                        <option value="dark">深色主题</option>
                        <option value="auto">跟随系统</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">
                        字体大小
                      </label>
                      <select className="w-full mt-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700">
                        <option value="small">小</option>
                        <option value="medium">中</option>
                        <option value="large">大</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                        <input type="checkbox" className="mr-2" />
                        自动保存
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 主编辑器区域 */}
        <div className="flex-1 flex flex-col">
          <AIEditor
            initialContent={content}
            onContentChange={handleContentChange}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  )
} 
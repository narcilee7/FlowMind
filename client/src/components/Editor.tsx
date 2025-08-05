import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { 
  Eye, 
  EyeOff, 
  Save, 
  Download, 
  Upload,
  Sparkles
} from 'lucide-react'

export const Editor: React.FC = () => {
  const { editorSettings, currentDocument } = useAppStore()
  const [content, setContent] = useState('# 欢迎使用 FlowMind\n\n开始编写您的文档...')
  const [showPreview, setShowPreview] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    // TODO: 实现保存逻辑
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const handleAIAssist = async () => {
    // TODO: 实现AI辅助功能
    console.log('AI辅助功能')
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 工具栏 */}
      <div className="h-12 border-b border-border bg-card flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="hover:bg-accent"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                隐藏预览
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                显示预览
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAIAssist}
            className="hover:bg-accent"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI助手
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="hover:bg-accent"
          >
            <Upload className="h-4 w-4 mr-2" />
            导入
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="hover:bg-accent"
          >
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={isLoading}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {/* 编辑器区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 编辑区 */}
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} border-r border-border`}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full p-6 resize-none outline-none bg-background text-foreground editor-content"
            style={{
              fontSize: `${editorSettings.fontSize}px`,
              fontFamily: editorSettings.fontFamily,
              lineHeight: editorSettings.lineHeight,
            }}
            placeholder="开始编写您的文档..."
          />
        </div>

        {/* 预览区 */}
        {showPreview && (
          <div className="w-1/2 p-6 overflow-auto bg-background">
            <div className="preview-content">
              <div dangerouslySetInnerHTML={{ 
                __html: content.replace(/\n/g, '<br>') 
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
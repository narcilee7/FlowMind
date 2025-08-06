import React from 'react'
import { 
  Eye, 
  EyeOff, 
  Save, 
  Download, 
  Upload,
  FileText,
  Settings
} from 'lucide-react'
import { Toolbar, ToolbarGroup } from '@/components/ui/toolbar'
import { IconButton } from '@/components/ui/icon-button'
import { Button } from '@/components/ui/button'

interface EditorToolbarProps {
  showPreview: boolean
  onTogglePreview: () => void
  onSave: () => void
  onImport: () => void
  onExport: () => void
  onAIAssist: () => void
  onSettings: () => void
  isLoading?: boolean
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  showPreview,
  onTogglePreview,
  onSave,
  onImport,
  onExport,
  onAIAssist,
  onSettings,
  isLoading = false
}) => {
  return (
    <Toolbar variant="border" className="h-12">
      <ToolbarGroup>
        <IconButton
          icon={showPreview ? EyeOff : Eye}
          onClick={onTogglePreview}
          title={showPreview ? '隐藏预览' : '显示预览'}
        />
        <IconButton
          icon={FileText}
          onClick={onAIAssist}
          title="AI助手"
        />
      </ToolbarGroup>

      <ToolbarGroup>
        <IconButton
          icon={Upload}
          onClick={onImport}
          title="导入文件"
        />
        <IconButton
          icon={Download}
          onClick={onExport}
          title="导出文件"
        />
        <IconButton
          icon={Settings}
          onClick={onSettings}
          title="编辑器设置"
        />
        <Button
          onClick={onSave}
          disabled={isLoading}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? '保存中...' : '保存'}
        </Button>
      </ToolbarGroup>
    </Toolbar>
  )
} 
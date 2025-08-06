/**
 * EditorToolbar组件 - 使用styled-components实现
 */

import React from 'react'
import styled from 'styled-components'
import { 
  Bold, Italic, Underline, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Code, Link, Image
} from 'lucide-react'
import { IconButton } from '@/components/ui/icon-button'
import { Toolbar } from '@/components/ui/toolbar'

export interface EditorToolbarProps {
  className?: string
  onAction?: (action: string) => void
}

const ToolbarContainer = styled(Toolbar)`
  border-bottom: 1px solid var(--border);
  background: var(--background);
  padding: 0.5rem;
`

const ToolbarGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0 0.5rem;
  border-right: 1px solid var(--border);
  
  &:last-child {
    border-right: none;
  }
`

const ToolbarSeparator = styled.div`
  width: 1px;
  height: 1.5rem;
  background: var(--border);
  margin: 0 0.5rem;
`

const EditorToolbar: React.FC<EditorToolbarProps> = ({ className, onAction }) => {
  const handleAction = (action: string) => {
    onAction?.(action)
  }

  return (
    <ToolbarContainer className={className}>
      {/* 文本格式 */}
      <ToolbarGroup>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => handleAction('bold')}
          title="粗体"
        >
          <Bold size={16} />
        </IconButton>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => handleAction('italic')}
          title="斜体"
        >
          <Italic size={16} />
        </IconButton>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => handleAction('underline')}
          title="下划线"
        >
          <Underline size={16} />
        </IconButton>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => handleAction('strikethrough')}
          title="删除线"
        >
          <Strikethrough size={16} />
        </IconButton>
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* 对齐方式 */}
      <ToolbarGroup>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => handleAction('align-left')}
          title="左对齐"
        >
          <AlignLeft size={16} />
        </IconButton>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => handleAction('align-center')}
          title="居中对齐"
        >
          <AlignCenter size={16} />
        </IconButton>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => handleAction('align-right')}
          title="右对齐"
        >
          <AlignRight size={16} />
        </IconButton>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => handleAction('align-justify')}
          title="两端对齐"
        >
          <AlignJustify size={16} />
        </IconButton>
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* 列表 */}
      <ToolbarGroup>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => handleAction('bullet-list')}
          title="无序列表"
        >
          <List size={16} />
        </IconButton>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => handleAction('numbered-list')}
          title="有序列表"
        >
          <ListOrdered size={16} />
        </IconButton>
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* 其他格式 */}
      <ToolbarGroup>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => handleAction('quote')}
          title="引用"
        >
          <Quote size={16} />
        </IconButton>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => handleAction('code')}
          title="代码"
        >
          <Code size={16} />
        </IconButton>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => handleAction('link')}
          title="链接"
        >
          <Link size={16} />
        </IconButton>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => handleAction('image')}
          title="图片"
        >
          <Image size={16} />
        </IconButton>
      </ToolbarGroup>
    </ToolbarContainer>
  )
}

export default EditorToolbar 
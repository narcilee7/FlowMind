import React from 'react'
import { cn } from '@/utils/cn'
import { Panel, PanelHeader } from '@/components/ui/panel'
import { IconButton } from '@/components/ui/icon-button'
import { Button } from '@/components/ui/button'
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  FileText, 
  MoreHorizontal,
  Plus
} from 'lucide-react'
import './FileTree.scss'

interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  children?: FileNode[]
  isExpanded?: boolean
}

interface FileTreeProps {
  files: FileNode[]
  currentFile?: string
  onFileSelect?: (file: FileNode) => void
  onFileCreate?: (parentPath: string, type: 'file' | 'folder') => void
  onFileDelete?: (file: FileNode) => void
  onFileRename?: (file: FileNode, newName: string) => void
  className?: string
}

const FileTreeNode: React.FC<{
  node: FileNode
  level: number
  currentFile?: string
  onFileSelect?: (file: FileNode) => void
  onToggleExpand?: (node: FileNode) => void
  onFileCreate?: (parentPath: string, type: 'file' | 'folder') => void
  onFileDelete?: (file: FileNode) => void
  onFileRename?: (file: FileNode, newName: string) => void
}> = ({
  node,
  level,
  currentFile,
  onFileSelect,
  onToggleExpand,
  onFileCreate,
  onFileDelete,
  onFileRename
}) => {
  const isCurrentFile = currentFile === node.path
  const isExpanded = node.isExpanded ?? false

  const handleToggle = () => {
    if (node.type === 'file') {
      onFileSelect?.(node)
    } else {
      onToggleExpand?.(node)
    }
  }

  return (
    <div className="file-tree-node">
      <div
        className={cn(
          'file-tree-item',
          isCurrentFile && 'file-tree-item--current',
          !isCurrentFile && 'file-tree-item--default'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {node.type === 'folder' && (
          <button
            onClick={() => onToggleExpand?.(node)}
            className="file-tree-toggle"
          >
            {isExpanded ? (
              <ChevronDown className="file-tree-toggle__icon" />
            ) : (
              <ChevronRight className="file-tree-toggle__icon" />
            )}
          </button>
        )}
        
        <button
          onClick={handleToggle}
          className="file-tree-content"
        >
          {node.type === 'folder' ? (
            isExpanded ? (
              <FolderOpen className="file-tree-content__icon file-tree-content__icon--folder" />
            ) : (
              <Folder className="file-tree-content__icon file-tree-content__icon--folder" />
            )
          ) : (
            <FileText className="file-tree-content__icon file-tree-content__icon--file" />
          )}
          <span className="file-tree-content__name">{node.name}</span>
        </button>

        <div className="file-tree-actions">
          <IconButton
            icon={MoreHorizontal}
            size="sm"
            className="file-tree-actions__button"
            title="更多操作"
          />
        </div>
      </div>

      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              currentFile={currentFile}
              onFileSelect={onFileSelect}
              onToggleExpand={onToggleExpand}
              onFileCreate={onFileCreate}
              onFileDelete={onFileDelete}
              onFileRename={onFileRename}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  currentFile,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
  className
}) => {
  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(new Set())

  const handleToggleExpand = (node: FileNode) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(node.id)) {
      newExpanded.delete(node.id)
    } else {
      newExpanded.add(node.id)
    }
    setExpandedNodes(newExpanded)
  }

  const processedFiles = React.useMemo(() => {
    const processNode = (node: FileNode): FileNode => ({
      ...node,
      isExpanded: expandedNodes.has(node.id),
      children: node.children?.map(processNode)
    })
    return files.map(processNode)
  }, [files, expandedNodes])

  return (
    <Panel className={cn('file-tree', className)}>
      <PanelHeader>
        <div className="file-tree-header">
          <h3 className="file-tree-header__title">文件树</h3>
          <div className="file-tree-header__actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFileCreate?.('', 'file')}
              className="file-tree-header__button"
            >
              <Plus className="file-tree-header__button-icon" />
              新建文件
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFileCreate?.('', 'folder')}
              className="file-tree-header__button"
            >
              <Plus className="file-tree-header__button-icon" />
              新建文件夹
            </Button>
          </div>
        </div>
      </PanelHeader>
      
      <div className="file-tree-content">
        {processedFiles.map((file) => (
          <FileTreeNode
            key={file.id}
            node={file}
            level={0}
            currentFile={currentFile}
            onFileSelect={onFileSelect}
            onToggleExpand={handleToggleExpand}
            onFileCreate={onFileCreate}
            onFileDelete={onFileDelete}
            onFileRename={onFileRename}
          />
        ))}
      </div>
    </Panel>
  )
} 
import React from 'react'
import { cn } from '@/utils/cn'
import { Panel, PanelHeader, PanelTitle } from '@/components/ui/panel'
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  Plus,
  MoreHorizontal
} from 'lucide-react'
import { IconButton } from '@/components/ui/icon-button'

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
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = node.isExpanded

  const handleToggle = () => {
    if (node.type === 'folder') {
      onToggleExpand?.(node)
    } else {
      onFileSelect?.(node)
    }
  }

  return (
    <div>
      <div
        className={cn(
          'flex items-center px-2 py-1 rounded cursor-pointer group',
          'hover:bg-accent hover:text-accent-foreground',
          isCurrentFile && 'bg-primary text-primary-foreground',
          !isCurrentFile && 'text-foreground'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {node.type === 'folder' && (
          <button
            onClick={() => onToggleExpand?.(node)}
            className="p-1 hover:bg-accent/50 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
        
        <button
          onClick={handleToggle}
          className="flex items-center gap-2 flex-1 text-left"
        >
          {node.type === 'folder' ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500" />
            )
          ) : (
            <FileText className="h-4 w-4 text-gray-500" />
          )}
          <span className="truncate">{node.name}</span>
        </button>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <IconButton
            icon={MoreHorizontal}
            variant="ghost"
            size="sm"
            className="h-6 w-6"
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
    <Panel className={cn('h-full overflow-auto', className)}>
      <PanelHeader>
        <PanelTitle className="flex items-center justify-between">
          <span>文件</span>
          <IconButton
            icon={Plus}
            variant="ghost"
            size="sm"
            title="新建文件"
            onClick={() => onFileCreate?.('', 'file')}
          />
        </PanelTitle>
      </PanelHeader>
      <div className="space-y-1">
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
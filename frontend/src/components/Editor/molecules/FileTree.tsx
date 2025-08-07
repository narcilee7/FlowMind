import React, { useState } from 'react'
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  isOpen?: boolean
}

export interface FileTreeProps {
  data: FileNode[]
  onSelect?: (node: FileNode) => void
  className?: string
}

const FileTree: React.FC<FileTreeProps> = ({ data, onSelect, className }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const renderNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children && node.children.length > 0

    return (
      <div key={node.id}>
        <div 
          className={cn(
            "flex items-center gap-1 py-1 px-0 cursor-pointer rounded hover:bg-accent hover:text-accent-foreground",
            `pl-${level * 6}`
          )}
          style={{ paddingLeft: `${level * 1.5}rem` }}
          onClick={() => {
            if (node.type === 'folder' && hasChildren) {
              toggleNode(node.id)
            }
            onSelect?.(node)
          }}
        >
          {node.type === 'folder' && hasChildren && (
            <div className="w-4 h-4 flex items-center justify-center text-muted-foreground">
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </div>
          )}
          {node.type === 'folder' && !hasChildren && (
            <div className="w-4 h-4 flex items-center justify-center text-muted-foreground">
              <Folder size={12} />
            </div>
          )}
          {node.type === 'folder' && hasChildren && (
            <div className="w-4 h-4 flex items-center justify-center text-muted-foreground">
              {isExpanded ? <FolderOpen size={12} /> : <Folder size={12} />}
            </div>
          )}
          {node.type === 'file' && (
            <div className="w-4 h-4 flex items-center justify-center text-muted-foreground">
              <File size={12} />
            </div>
          )}
          <span className="flex-1 select-none">{node.name}</span>
        </div>
        
        {node.type === 'folder' && hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("p-2 bg-background border border-border rounded-lg text-sm", className)}>
      {data.map(node => renderNode(node))}
    </div>
  )
}

export default FileTree 
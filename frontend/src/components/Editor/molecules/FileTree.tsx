/**
 * FileTree组件 - 使用styled-components实现
 */

import React, { useState } from 'react'
import styled from 'styled-components'
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react'

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

const FileTreeContainer = styled.div`
  padding: 0.5rem;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 0.875rem;
`

const TreeNode = styled.div<{ level: number }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0;
  padding-left: ${props => props.level * 1.5}rem;
  cursor: pointer;
  border-radius: 0.25rem;
  
  &:hover {
    background: var(--accent);
    color: var(--accent-foreground);
  }
`

const TreeIcon = styled.div`
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted-foreground);
`

const TreeName = styled.span`
  flex: 1;
  user-select: none;
`

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
        <TreeNode level={level} onClick={() => {
          if (node.type === 'folder' && hasChildren) {
            toggleNode(node.id)
          }
          onSelect?.(node)
        }}>
          {node.type === 'folder' && hasChildren && (
            <TreeIcon>
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </TreeIcon>
          )}
          {node.type === 'folder' && !hasChildren && (
            <TreeIcon>
              <Folder size={12} />
            </TreeIcon>
          )}
          {node.type === 'folder' && hasChildren && (
            <TreeIcon>
              {isExpanded ? <FolderOpen size={12} /> : <Folder size={12} />}
            </TreeIcon>
          )}
          {node.type === 'file' && (
            <TreeIcon>
              <File size={12} />
            </TreeIcon>
          )}
          <TreeName>{node.name}</TreeName>
        </TreeNode>
        
        {node.type === 'folder' && hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <FileTreeContainer className={className}>
      {data.map(node => renderNode(node))}
    </FileTreeContainer>
  )
}

export default FileTree 
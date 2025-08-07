/**
 * 编辑器核心组件
 */

import React from 'react'
import { EditorMode } from '../types/EditorMode'

interface EditorShellProps {
    mode: EditorMode
}

const EditorShell = React.memo(function EditorShell({ mode }: EditorShellProps) {
    // TODO: 真正实现多种mode下的编辑器

    return (
        <div>
            <h1>{mode} EditorShell</h1>
        </div>
    )
})

export default EditorShell
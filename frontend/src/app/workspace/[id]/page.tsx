'use client'

import EditorShell from '@/components/Editor/core/EditorShell'
import { EditorMode } from '@/components/Editor/types/EditorMode'

type PageProps = {
  params: { id: string }
  searchParams?: Record<string, string | string[] | undefined>
}

export default function WorkspaceEditorPage({ params: _params, searchParams }: PageProps) {
  const modeParam = (searchParams?.mode as string) ?? 'writing'
  const mode = (Array.isArray(modeParam) ? modeParam[0] : modeParam) as EditorMode

  return (
    <div className="h-full">
      <EditorShell mode={mode} />
    </div>
  )
}



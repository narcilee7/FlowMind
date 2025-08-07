'use client'

import { useSearchParams } from 'next/navigation'
import EditorShell from '@/components/Editor/core/EditorShell'
import { EditorMode } from '@/components/Editor/types/EditorMode'

export default function EditorPage() {
  const mode = useSearchParams().get('mode') ?? 'writing'
  return <EditorShell mode={mode as EditorMode} />
}
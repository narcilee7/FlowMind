'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SlashAndPaletteWrapper from './slash-and-palette-wrapper'
import EditorShell from '@/components/Editor/core/EditorShell'
import { EditorMode } from '@/components/Editor/types/EditorMode'

type PageProps = {
  params: { id: string }
  searchParams?: Record<string, string | string[] | undefined>
}

function normalizeMode(template?: string | null): EditorMode {
  if (!template) return 'writing'
  const t = template.toLowerCase()
  if (t.includes('research')) return 'graph'
  if (t.includes('planning')) return 'canvas'
  if (t.includes('learning')) return 'timeline'
  if (t.includes('creative')) return 'canvas'
  if (t.includes('writing')) return 'writing'
  return 'writing'
}

export default function WorkspaceEditorPage({ params, searchParams }: PageProps) {
  const router = useRouter()
  const modeParam = (searchParams?.mode as string) ?? 'writing'
  const mode = (Array.isArray(modeParam) ? modeParam[0] : modeParam) as EditorMode
  const templateParam = (searchParams?.template as string) ?? null

  // 一次性规范化：当 mode=auto 或未显式提供时，依据 template 推断并替换 URL
  useEffect(() => {
    const isAuto = mode === ('auto' as EditorMode)
    if (isAuto) {
      const nextMode = normalizeMode(templateParam)
      const usp = new URLSearchParams()
      usp.set('mode', nextMode)
      if (templateParam) usp.set('template', templateParam)
      router.replace(`/workspace/${params.id}?${usp.toString()}`)
    }
  }, [mode, templateParam, params.id, router])

  return (
    <SlashAndPaletteWrapper>
      <div className="h-full">
        <EditorShell mode={mode === ('auto' as EditorMode) ? normalizeMode(templateParam) : mode} />
      </div>
    </SlashAndPaletteWrapper>
  )
}



'use client'

import { Button } from '@/components/ui/button'

const templates = [
  { id: 'ai-writing', name: 'AI Writing' },
  { id: 'ai-research', name: 'AI Research' },
  { id: 'ai-learning', name: 'AI Learning' },
  { id: 'ai-planning', name: 'AI Planning' },
  { id: 'ai-creative', name: 'AI Creative' },
]

export default function WorkspaceNewPage() {
  const createWorkspace = (template?: string) => {
    const newId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    const mode = 'auto'
    const query = new URLSearchParams()
    query.set('mode', mode)
    if (template) query.set('template', template)
    window.location.href = `/workspace/${newId}?${query.toString()}`
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold">新建 Workspace</h1>
      <p className="text-muted-foreground mt-2">选择一个场景模板开始创建，或直接创建空白项目。</p>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {templates.map((tpl) => (
          <Button key={tpl.id} variant="secondary" onClick={() => createWorkspace(tpl.id)}>
            {tpl.name}
          </Button>
        ))}
        <Button variant="default" onClick={() => createWorkspace()}>空白</Button>
      </div>
    </div>
  )
}



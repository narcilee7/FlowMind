'use client'

import { Button } from '@/components/ui/button'

export default function WorkspaceHomePage() {
  return (
    <section
      className="h-full w-full flex flex-col items-center justify-center text-center px-4 py-12"
      aria-label="Workspace entry"
    >
      <h1 className="text-4xl font-bold mb-4">Workspace</h1>
      <p className="text-lg text-muted-foreground max-w-xl">
        进入沉浸式创作空间，或创建一个新的 Workspace。
      </p>
      <div className="mt-8 flex gap-3">
        <Button
          variant="default"
          size="lg"
          onClick={() => {
            window.location.href = '/workspace/new'
          }}
          aria-label="Create workspace"
        >
          新建 Workspace
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => {
            window.location.href = '/editor?mode=writing'
          }}
          aria-label="Quick start editor"
        >
          快速进入编辑器
        </Button>
      </div>
    </section>
  )
}



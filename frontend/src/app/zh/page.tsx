'use client'

import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <section
      className="h-full w-full flex flex-col items-center justify-center text-center px-4 py-12"
      aria-label="欢迎页"
    >
      <h1 className="text-4xl font-bold mb-4">欢迎使用 AI Native Editor</h1>
      <p className="text-lg text-muted-foreground max-w-xl">
        一个云端、AI 原生的沉浸式内容创作平台，集写作、研究、学习、规划于一体。
      </p>
      <div className="mt-8">
        <Button
          variant="default"
          size="lg"
          onClick={() => {
            window.location.href = '/zh/editor'
          }}
          aria-label="开始创作，进入编辑器"
        >
          开始创作
        </Button>
      </div>
    </section>
  )
}

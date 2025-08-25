'use client'

import { Button } from '@/components/ui/button'

export default function Hero() {
  return (
    <section
      className="w-full min-h-[80vh] min-w-[320px] flex flex-col items-center justify-center text-center px-6 py-20"
      aria-label="欢迎使用 AI Native Workspace"
    >
      <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight leading-tight">
        AI Native Workspace
      </h1>
      <p className="text-muted-foreground text-base md:text-lg max-w-2xl mb-6">
        一个云端、AI 原生的沉浸式内容创作平台，集写作、研究、学习、规划于一体。
      </p>
      <Button
        size="lg"
        onClick={() => {
          window.location.href = '/editor'
        }}
        aria-label="开始创作"
      >
        开始创作
      </Button>
    </section>
  )
}

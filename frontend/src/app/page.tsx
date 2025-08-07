'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Sparkles, PencilLine, BrainCog, BookOpenText, CalendarClock } from 'lucide-react'

export default function HomePage() {
  return (
    <section className="min-h-screen w-full flex flex-col items-center justify-center text-center px-4 py-16 bg-background">
      <div className="max-w-3xl">
        <h1 className="text-5xl font-bold leading-tight mb-4">
          FlowMind · AI Native Editor
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          一体化 · 沉浸式 · AI-First 的创作平台<br />
          写作、研究、学习、规划，一站式完成。
        </p>

        <div className="mt-6 flex justify-center gap-4 flex-wrap">
          <Link href="/editor?mode=writing">
            <Button variant="default" size="lg" aria-label="立即开始创作">
              🚀 开始创作
            </Button>
          </Link>
          <Link href="/explore">
            <Button variant="outline" size="lg" aria-label="探索 AI 模板">
              <Sparkles className="w-4 h-4 mr-2" />
              探索 AI 能力
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl w-full">
        <Feature icon={PencilLine} title="AI 写作" desc="从灵感到成稿，AI 帮你流畅完成整篇文章。" />
        <Feature icon={BrainCog} title="AI 研究" desc="多文献理解、结构化分析、知识图谱归纳。" />
        <Feature icon={BookOpenText} title="AI 学习" desc="长文本拆解、重点提取、自主学习空间。" />
        <Feature icon={CalendarClock} title="AI 规划" desc="任务规划、目标拆解、时间线智能协同。" />
      </div>

      <footer className="mt-20 text-sm text-muted-foreground">
        <p>© 2025 FlowMind · Made for creators & thinkers</p>
      </footer>
    </section>
  )
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType
  title: string
  desc: string
}) {
  return (
    <div className="bg-muted p-6 rounded-xl shadow-sm text-left h-full">
      <div className="flex items-center gap-2 mb-2 text-primary">
        <Icon className="w-5 h-5" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

const viewModes = [
  { label: '写作', value: 'writing' },
  { label: '图谱', value: 'graph' },
  { label: '画布', value: 'canvas' },
  { label: '表格', value: 'table' },
  { label: '时间线', value: 'timeline' },
  { label: '卡片', value: 'card' },
]

export default function Header({ mode }: { mode?: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentMode = mode ?? searchParams.get('mode') ?? 'writing'

  // 统一跳转到 workspace/[id] 或 editor 根路由
  // 规则：如果当前路径以 /workspace/ 开头，则保持路径并仅更新 ?mode；否则跳到 /editor
  const makeHref = (m: string) => {
    const isWorkspace = pathname?.startsWith('/workspace/')
    if (isWorkspace) {
      const base = pathname
      const sp = new URLSearchParams(Array.from(searchParams.entries()))
      sp.set('mode', m)
      return `${base}?${sp.toString()}`
    }
    return `/editor?mode=${m}`
  }

  return (
    <header className="sticky top-0 z-20 h-12 border-b bg-background/70 backdrop-blur flex items-center px-4 justify-between">
      <div className="flex items-center gap-3">
        <Link href="/" className="font-bold text-sm text-primary">
          FlowMind
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {viewModes.map((m) => (
          <Link key={m.value} href={makeHref(m.value)}>
            <Button
              variant={currentMode === m.value ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs"
            >
              {m.label}
            </Button>
          </Link>
        ))}
      </div>
    </header>
  )
}

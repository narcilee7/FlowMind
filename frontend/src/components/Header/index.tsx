'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

const modes = [
  { label: '写作', value: 'writing' },
  { label: '研究', value: 'research' },
  { label: '学习', value: 'learning' },
  { label: '规划', value: 'planning' },
  { label: '创意', value: 'creative' },
]

export default function Header({ mode }: { mode: string }) {

  return (
    <header className="sticky top-0 z-20 h-12 border-b bg-background/70 backdrop-blur flex items-center px-4 justify-between">
      <div className="flex items-center gap-3">
        <Link href="/" className="font-bold text-sm text-primary">
          FlowMind
        </Link>
        {modes.map((m) => (
          <Link key={m.value} href={`/editor?mode=${m.value}`}>
            <Button
              variant={mode === m.value ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs"
            >
              {m.label}
            </Button>
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Link href="/search">
          <Button variant="ghost" size="icon" className="text-xs">🔍</Button>
        </Link>
      </div>
    </header>
  )
}

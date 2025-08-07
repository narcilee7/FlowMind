'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

const routes = [
  { label: '写作', path: '/editor?mode=writing' },
  { label: '研究', path: '/editor?mode=research' },
  { label: '学习', path: '/editor?mode=learning' },
  { label: '规划', path: '/editor?mode=planning' },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-20 h-12 border-b border-border bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-4 justify-between">
      <div className="flex items-center gap-3">
        <span className="font-bold text-sm flex items-center gap-2">
          <span className="text-primary">FlowMind</span>
          <span className="text-muted-foreground">AI Native Editor</span>
        </span>
        {routes.map((r) => (
          <Link key={r.path} href={r.path}>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              aria-current={pathname === r.path ? 'page' : undefined}
            >
              {r.label}
            </Button>
          </Link>
        ))}
      </div>

      {/* 可选：命令面板按钮 / 主题切换 */}
    </header>
  )
}

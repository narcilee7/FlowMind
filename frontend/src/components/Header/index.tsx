'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

const routes = [
  { label: '研究', path: '/research' },
  { label: '写作', path: '/writing' },
  { label: '学习', path: '/learning' },
  { label: '规划', path: '/planning' },
  { label: '创意', path: '/creative' },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 h-12 border-b border-border bg-background/70 backdrop-blur flex items-center px-4 justify-between">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-bold text-sm text-primary">
          FlowMind
        </Link>
        <span className="text-muted-foreground text-xs">AI Native Editor</span>

        {routes.map((r) => (
          <Link key={r.path} href={r.path}>
            <Button
              variant={pathname.startsWith(r.path) ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs"
            >
              {r.label}
            </Button>
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Link href="/search">
          <Button variant="ghost" size="icon">🔍</Button>
        </Link>
        {/* TODO: 用户按钮 / 命令面板 / 主题切换 */}
      </div>
    </header>
  )
}

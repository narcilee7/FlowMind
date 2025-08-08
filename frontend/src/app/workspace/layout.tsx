'use client'

import Header from '@/components/Header'
import FloatingAgent from '@/components/FloatingAgent'
import { useSearchParams } from 'next/navigation'

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const mode = useSearchParams().get('mode') ?? 'writing'
  return (
    <div className="relative min-h-screen flex flex-col">
      <Header mode={mode} />
      <main className="flex-1 overflow-hidden">{children}</main>
      <FloatingAgent />
    </div>
  )
}



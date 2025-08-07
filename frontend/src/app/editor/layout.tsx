'use client'

import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import FloatingAgent from '@/components/FloatingAgent'

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') ?? 'writing' // 默认模式

  return (
    <div className="flex flex-col h-screen">
      <Header mode={mode} />
      <main className="flex-1 overflow-hidden">{children}</main>
      <FloatingAgent />
    </div>
  )
}

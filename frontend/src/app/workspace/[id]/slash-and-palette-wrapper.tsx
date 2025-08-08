'use client'

import React from 'react'
import SlashMenu from '@/components/Editor/molecules/SlashMenu'
import CommandPalette from '@/components/Editor/molecules/CommandPalette'

export default function SlashAndPaletteWrapper({ children }: { children: React.ReactNode }) {
  const [slashOpen, setSlashOpen] = React.useState(false)
  const [paletteOpen, setPaletteOpen] = React.useState(false)

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K 打开命令面板
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
        return
      }
      // 输入 / 打开快速菜单（仅当未在输入框聚焦时）
      if (!e.ctrlKey && !e.metaKey && e.key === '/') {
        const active = document.activeElement
        const editable = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)
        if (!editable) {
          e.preventDefault()
          setSlashOpen(true)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      {children}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100]">
        <SlashMenu
          isOpen={slashOpen}
          onClose={() => setSlashOpen(false)}
          onSelect={(item) => {
            item.action()
            setSlashOpen(false)
          }}
        />
      </div>
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={(item) => {
          item.action()
          setPaletteOpen(false)
        }}
      />
    </>
  )
}



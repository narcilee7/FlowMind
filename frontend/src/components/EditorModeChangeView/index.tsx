'use client'

import { Button } from '@/components/ui/button'
import { EditorMode } from '@/components/Editor/types/EditorMode'
import { BookOpen, Brain, Calendar, Search } from 'lucide-react'

interface EditorModeChangeViewProps {
    activeMode: EditorMode
    onChange: (mode: EditorMode) => void
    mode: EditorMode
}

export const MODES = ['writing', 'research', 'planning', 'learning', 'other'] as const

const iconLabels: Record<EditorMode, React.ReactNode> = {
    writing: <BookOpen className="w-4 h-4" />,
    research: <Search className="w-4 h-4" />,
    planning: <Calendar className="w-4 h-4" />,
    learning: <Brain className="w-4 h-4" />,
    other: <BookOpen className="w-4 h-4" />,
}

function EditorModeChangeView({ activeMode, onChange, mode }: EditorModeChangeViewProps) {
    return (
        <div className="flex gap-1 rounded-xl bg-muted p-1">
        {MODES.map((mode) => (
          <Button
            key={mode}
            variant={mode === activeMode ? 'default' : 'ghost'}
            onClick={() => onChange(mode)}
            size="sm"
          >
            {iconLabels[mode as EditorMode]}
          </Button>
        ))}
      </div>
    )
}

export default EditorModeChangeView
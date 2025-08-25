'use client'

import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <section
      className="h-full w-full flex flex-col items-center justify-center text-center px-4 py-12"
      aria-label="Welcome page"
    >
      <h1 className="text-4xl font-bold mb-4">Welcome to AI Native Workspace</h1>
      <p className="text-lg text-muted-foreground max-w-xl">
        An AI-native immersive content creation platform, combining writing, research, learning, and planning.
      </p>
      <div className="mt-8">
        <Button
          variant="default"
          size="lg"
          onClick={() => {
            window.location.href = '/en/editor'
          }}
          aria-label="Start creating, enter the editor"
        >
          Start creating
        </Button>
      </div>
    </section>
  )
}

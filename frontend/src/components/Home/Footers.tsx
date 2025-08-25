export default function Footer() {
    return (
      <footer
        className="w-full text-center text-sm text-muted-foreground py-6 border-t"
        aria-label="页脚"
      >
        <p>© {new Date().getFullYear()} FlowMind — AI Native Workspace</p>
        <p className="text-xs mt-1">Clean · AI Deep · AI First</p>
      </footer>
    )
  }
  
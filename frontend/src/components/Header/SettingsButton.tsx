import React from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface SettingsButtonProps {
  onClick?: () => void
}

const SettingsButton: React.FC<SettingsButtonProps> = ({ onClick }) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className='hover:bg-accent hover:text-accent-foreground'
      title="设置"
    >
      <Settings size={16} />
    </Button>
  )
}

export default SettingsButton
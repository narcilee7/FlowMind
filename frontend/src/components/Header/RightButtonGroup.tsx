import React from 'react'
import ThemeToggle from './ThemeToggle'
import SettingsButton from './SettingsButton'

const RightButtonGroup: React.FC = () => {
  return (
    <div className='flex items-center gap-2'>
      <ThemeToggle />
      <SettingsButton />
    </div>
  )
}

export default RightButtonGroup
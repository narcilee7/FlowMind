import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import React from 'react'
import './SettingsButton.scss'

const SettingsButton: React.FC = () => {
    const handleClick = () => {
        console.log('SettingsButton clicked')
    }
    return (
        <Button variant='outline' size='sm' className='settings-button' onClick={handleClick}>
            <Settings className='settings-button__icon' />
        </Button>
    )
}

export default React.memo(SettingsButton) as typeof SettingsButton
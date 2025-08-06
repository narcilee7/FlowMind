import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import React from 'react'

const SettingsButton: React.FC = () => {
    const handleClick = () => {
        console.log('SettingsButton clicked')
    }
    return (
        <Button variant='outline' size='sm' className='hover:bg-accent' onClick={handleClick}>
            <Settings className='h-4 w-4' />
        </Button>
    )
}

export default React.memo(SettingsButton) as typeof SettingsButton
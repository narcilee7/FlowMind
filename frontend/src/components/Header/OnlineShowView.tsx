import { Wifi, WifiOff } from 'lucide-react'
import React from 'react'

interface OnlineShowViewProps {
    isOnline: boolean
}

const OnlineShowView: React.FC<OnlineShowViewProps> = ({ isOnline }) => {

    const renderContent = React.useMemo(() => {
        if (isOnline) {
            return (
                <>
                    <Wifi className='h-3 w-3 text-green-500' />
                    <span>在线</span>
                </>
            )
        }
        return (
            <>
                <WifiOff className='h-3 w-3 text-yellow-500' />
                <span>离线</span>
            </>
        )
    }, [isOnline])

    return (
        <div className='flex items-center gap-1 text-sm text-muted-foreground'>
            {renderContent}
        </div>
    )
}

export default React.memo(OnlineShowView) as typeof OnlineShowView
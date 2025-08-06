import { Wifi, WifiOff } from 'lucide-react'
import React from 'react'
import "./OnlineShowView.scss"

interface OnlineShowViewProps {
    isOnline: boolean
}

const OnlineShowView: React.FC<OnlineShowViewProps> = ({ isOnline }) => {

    const renderContent = React.useMemo(() => {
        if (isOnline) {
            return (
                <>
                    <Wifi className='online-show-view__icon' />
                    <span>在线</span>
                </>
            )
        }
        return (
            <>
                <WifiOff className='online-show-view__icon' />
                <span>离线</span>
            </>
        )
    }, [isOnline])

    return (
        <div className='online-show-view'>
            {renderContent}
        </div>
    )
}

export default React.memo(OnlineShowView) as typeof OnlineShowView
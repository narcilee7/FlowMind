import React from 'react'
import { Wifi, WifiOff } from 'lucide-react'

export interface OnlineShowViewProps {
  isOnline: boolean
}

const OnlineShowView: React.FC<OnlineShowViewProps> = ({ isOnline }) => {
    return (
    <div
      className='flex items-center gap-2 p-2 rounded-md text-sm font-medium transition-all duration-200'
    >
      {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
      <span
        className='text-muted-foreground text-sm'
      >{isOnline ? '在线' : '离线'}</span>
    </div>
  )
}

export default OnlineShowView
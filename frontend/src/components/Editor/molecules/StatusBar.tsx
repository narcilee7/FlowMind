
import React from 'react'
import { cn } from '@/utils/cn'

const StatusBar: React.FC = () => {

  return (
    <div className={cn('flex items-center justify-between p-2 border-t border-border')}>
      <div className='flex items-center gap-2'>
        <div className='flex items-center gap-2'>
          <span>就绪</span>
        </div>
      </div>
      
      <div className='flex items-center gap-2'>
        <div className='flex items-center gap-2'>
          <span>Ln 1, Col 1</span>
        </div>
        <div className='flex items-center gap-2'>
          <span>UTF-8</span>
        </div>
        <div className='flex items-center gap-2'>
          <span>TypeScript</span>
        </div>
      </div>
    </div>
  )
}

export default StatusBar 
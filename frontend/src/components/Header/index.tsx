/**
 * Header组件 - 使用Tailwind CSS实现
 */

import React from 'react'
import RightButtonGroup from './RightButtonGroup'

const Header: React.FC = () => {
  return (
    <div className='flex items-center justify-between p-4 border-b border-border'>
      <div className='text-2xl font-bold'>FlowMind</div>
      <div className='flex items-center gap-2'>
        <RightButtonGroup />
      </div>
    </div>
  )
}

export default Header 
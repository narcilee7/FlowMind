import React from 'react'

interface RightButtonGroupProps {
    children: React.ReactNode
}

const RightButtonGroup: React.FC<RightButtonGroupProps> = ({ children }) => {
    return (
        <div className='flex items-center gap-2'>
            {children}
        </div>
    )
}

export default React.memo(RightButtonGroup) as typeof RightButtonGroup
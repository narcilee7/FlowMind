import React from 'react'
import "./RightButtonGroup.scss"

interface RightButtonGroupProps {
    children: React.ReactNode
}

const RightButtonGroup: React.FC<RightButtonGroupProps> = ({ children }) => {
    return (
        <div className='right-button-group'>
            {children}
        </div>
    )
}

export default React.memo(RightButtonGroup) as typeof RightButtonGroup
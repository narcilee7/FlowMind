import React from "react"
import "./BottomView.scss"

interface BottomViewProps {
    // children: React.ReactNode
    isSidebarCollapsed: boolean
}


const BottomView: React.FC<BottomViewProps> = ({ isSidebarCollapsed }) => {
    return (
        <div className="bottom-view">
            <div className={`bottom-view__icon ${isSidebarCollapsed ? 'bottom-view__icon--collapsed' : 'bottom-view__icon--expanded'}`}>
                <div className="bottom-view__item"></div>
                {!isSidebarCollapsed && <span>FlowMind v1.0</span>}
            </div>
        </div>
    )
}

export default React.memo(BottomView) as typeof BottomView
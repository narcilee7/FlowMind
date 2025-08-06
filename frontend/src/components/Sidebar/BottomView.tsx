import React from "react"

interface BottomViewProps {
    // children: React.ReactNode
    isSidebarCollapsed: boolean
}


const BottomView: React.FC<BottomViewProps> = ({ isSidebarCollapsed }) => {
    return (
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-border bg-card">
            <div className={`
                flex items-center gap-2 text-xs text-muted-foreground
                ${isSidebarCollapsed ? 'justify-center' : 'px-2'}
            `}>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {!isSidebarCollapsed && <span>FlowMind v1.0</span>}
            </div>
        </div>
    )
}

export default React.memo(BottomView) as typeof BottomView
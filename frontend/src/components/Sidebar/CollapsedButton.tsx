import React from "react"
import { Button } from "../ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import "./CollapsedButton.scss"

interface CollapsedButtonProps {
    isSidebarCollapsed: boolean
    toggleSidebar: () => void
}

const CollapsedButton: React.FC<CollapsedButtonProps> = (props) => {
    const { isSidebarCollapsed, toggleSidebar } = props

    return (
        <div className="collapsed-button-container">
            <Button 
                variant="ghost"
                size="icon"
                onClick={toggleSidebar} 
                className="collapsed-button"
            >
                {isSidebarCollapsed ? (
                    <ChevronRight className="collapsed-button__icon" />
                ) : ( 
                    <ChevronLeft className="collapsed-button__icon" />
                )}
            </Button>
        </div>
    )
}

export default React.memo(CollapsedButton) as typeof CollapsedButton
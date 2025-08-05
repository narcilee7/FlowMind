import React from "react"
import { Button } from "../ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CollapsedButtonProps {
    isSidebarCollapsed: boolean
    toggleSidebar: () => void
}

const CollapsedButton: React.FC<CollapsedButtonProps> = (props) => {
    const { isSidebarCollapsed, toggleSidebar } = props

    return (
        <div className="p-2 border-b border-border">
            <Button 
                variant="ghost" 
                size="sm"
                onClick={toggleSidebar} 
                className="w-full h-8 hover:bg-accent"
            >
                {isSidebarCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                ) : ( 
                    <ChevronLeft className="h-4 w-4" />
                )}
            </Button>
        </div>
    )
}

export default React.memo(CollapsedButton) as typeof CollapsedButton
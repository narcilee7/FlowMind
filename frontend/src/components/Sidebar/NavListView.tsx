import React from "react"
import { Button } from "@/components/ui/button"

interface NavListViewProps {
    isSidebarCollapsed: boolean
    menuList: MenuItem[]
}

interface MenuItem {
    icon: React.ElementType
    label: string
    path: string
    badge: string | null
}

const NavListView: React.FC<NavListViewProps> = (props) => {
    const { isSidebarCollapsed, menuList } = props

    const toastShow = React.useCallback((item: MenuItem) => {
        if (isSidebarCollapsed) {
            return (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                    {item.badge && (
                        <span className="ml-1 text-xs text-muted-foreground">
                            ({item.badge})
                        </span>
                    )}
                </div>
            )
        }
        return null
    }, [isSidebarCollapsed])

    return (
        <nav className="p-2 space-y-1">
            {menuList.length > 0 && menuList.map((item) => {
                return (
                    <Button
                        key={item.path}
                        variant="ghost"
                        className={`
                            w-full justify-start gap-3 h-10 relative group
                            hover:bg-accent hover:text-accent-foreground
                            ${isSidebarCollapsed ? 'px-2' : 'px-3'}
                        `}
                    >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isSidebarCollapsed && (
                            <>
                                <span className="truncate flex-1 text-left">{item.label}</span>
                                {item.badge && (
                                    <span className={`
                                        text-xs px-2 py-0.5 rounded-full flex-shrink-0
                                        ${item.badge === 'Pro' 
                                            ? 'bg-primary/10 text-primary' 
                                            : 'bg-muted text-muted-foreground'
                                        }
                                    `}>
                                        {item.badge}
                                    </span>
                                )}
                            </>
                        )}

                        {toastShow(item)}
                    </Button>
                )
            })}
        </nav>
    )
}

export default React.memo(NavListView) as typeof NavListView
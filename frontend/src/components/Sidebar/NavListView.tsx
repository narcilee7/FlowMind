import React from "react"
import { Button } from "@/components/ui/button"
import "./NavListView.scss"

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
                <div className="nav-tooltip">
                    {item.label}
                    {item.badge && (
                        <span className="nav-tooltip__badge">
                            ({item.badge})
                        </span>
                    )}
                </div>
            )
        }
        return null
    }, [isSidebarCollapsed])

    return (
        <nav className="nav-list">
            {menuList.length > 0 && menuList.map((item) => {
                return (
                    <Button
                        key={item.path}
                        variant="ghost"
                        className={`
                            nav-item
                            ${isSidebarCollapsed ? 'nav-item--collapsed' : ''}
                        `}
                    >
                        <item.icon className="nav-item__icon" />
                        {!isSidebarCollapsed && (
                            <>
                                <span className="nav-item__label">{item.label}</span>
                                {item.badge && (
                                    <span className={`
                                        nav-item__badge
                                        ${item.badge === 'Pro' ? 'nav-item__badge--pro' : 'nav-item__badge--default'}
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
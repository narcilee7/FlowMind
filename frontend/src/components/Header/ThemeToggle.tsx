import { useAppStore } from "@/stores/app-store"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import React from "react"
import "./ThemeToggle.scss"

const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useAppStore()

    const handleClick = () => {
        setTheme(theme === 'light' ? 'dark' : 'light')
    }

    return (
        <Button variant='outline' size='sm' className='theme-toggle' onClick={handleClick}>
            {theme === 'light' ? (
                <Moon className='theme-toggle__icon' />
            ) : (
                <Sun className='theme-toggle__icon' />
            )}
        </Button>
    )
}

export default React.memo(ThemeToggle) as typeof ThemeToggle
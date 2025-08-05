import { useAppStore } from "@/stores/app-store"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import React from "react"

const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useAppStore()

    const handleClick = () => {
        setTheme(theme === 'light' ? 'dark' : 'light')
    }

    return (
        <Button variant='outline' size='sm' className='hover:bg-accent' onClick={handleClick}>
            {theme === 'light' ? (
                <Moon className='h-4 w-4' />
            ) : (
                <Sun className='h-4 w-4' />
            )}
        </Button>
    )
}

export default React.memo(ThemeToggle) as typeof ThemeToggle
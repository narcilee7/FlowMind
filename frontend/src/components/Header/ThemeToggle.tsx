import { Moon, Sun } from "lucide-react"
import React from "react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/useTheme"  

const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme()

    const handleClick = () => {
        setTheme(theme === 'light' ? 'dark' : 'light')
    }

    return (
        <Button onClick={handleClick}
            variant="ghost"
            size="icon"
            className='hover:bg-accent hover:text-accent-foreground'
        >
            {theme === 'dark' ? (
                <Sun size={16} />
            ) : (
                <Moon size={16} />
            )}
        </Button>
    )
}

export default React.memo(ThemeToggle) as typeof ThemeToggle
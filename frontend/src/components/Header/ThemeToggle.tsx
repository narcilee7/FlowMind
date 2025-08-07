import { useTheme } from "@/styles/ThemeProvider"
import { Moon, Sun } from "lucide-react"
import React from "react"
import styled from "styled-components"

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  background: var(--background);
  color: var(--foreground);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;

  &:hover {
    background: var(--accent);
    border-color: var(--accent-foreground);
  }

  &:focus {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }

  .theme-toggle__icon {
    width: 1rem;
    height: 1rem;
  }
`

const ThemeToggle: React.FC = () => {
    const { themeType, toggleTheme, isDark } = useTheme()

    const handleClick = () => {
        toggleTheme()
    }

    return (
        <StyledButton onClick={handleClick}>
            {isDark ? (
                <Sun className='theme-toggle__icon' />
            ) : (
                <Moon className='theme-toggle__icon' />
            )}
        </StyledButton>
    )
}

export default React.memo(ThemeToggle) as typeof ThemeToggle
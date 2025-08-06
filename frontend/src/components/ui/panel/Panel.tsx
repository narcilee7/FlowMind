/**
 * Panel组件 - 使用styled-components实现
 */

import React from 'react'
import styled, { css } from 'styled-components'

export interface PanelProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'bordered' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const panelVariants = {
  default: css`
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  `,
  bordered: css`
    background: var(--background);
    border: 2px solid var(--border);
    border-radius: var(--radius);
  `,
  elevated: css`
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-md);
  `
}

const panelPadding = {
  none: css`padding: 0;`,
  sm: css`padding: 0.5rem;`,
  md: css`padding: 1rem;`,
  lg: css`padding: 1.5rem;`
}

const StyledPanel = styled.div<PanelProps>`
  ${props => panelVariants[props.variant || 'default']}
  ${props => panelPadding[props.padding || 'md']}
  
  transition: all 0.2s ease-in-out;
`

export const Panel: React.FC<PanelProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'md',
  ...props
}) => {
  return (
    <StyledPanel
      className={className}
      variant={variant}
      padding={padding}
      {...props}
    >
      {children}
    </StyledPanel>
  )
}

export default Panel

export interface PanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const PanelHeader = React.forwardRef<HTMLDivElement, PanelHeaderProps>(
  ({ className, children, ...props }, ref) => {
    const panelHeaderClasses = cn('panel-header', className)

    return (
      <div
        className={panelHeaderClasses}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PanelHeader.displayName = "PanelHeader"

export interface PanelTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

const PanelTitle = React.forwardRef<HTMLHeadingElement, PanelTitleProps>(
  ({ className, children, ...props }, ref) => {
    const panelTitleClasses = cn('panel-title', className)

    return (
      <h3
        className={panelTitleClasses}
        ref={ref}
        {...props}
      >
        {children}
      </h3>
    )
  }
)
PanelTitle.displayName = "PanelTitle"

export { Panel, PanelHeader, PanelTitle } 
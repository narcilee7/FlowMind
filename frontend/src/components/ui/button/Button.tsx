import * as React from "react"
import { cn } from "@/utils/cn"
import "./Button.scss"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}
// 按钮变体: 默认、危险、轮廓、次要、幽灵、链接
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
// 按钮尺寸: 默认、小、大、图标
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const {
      className,
      variant = 'default',
      size = 'default',
      asChild = false,
      ...rest
    } = props

    const buttonClasses = cn(
      'btn',
      `btn--${variant}`,
      `btn--${size}`,
      className
    )

    return (
      <button
        className={buttonClasses}
        ref={ref}
        {...rest}
      />
    )
  }
)
Button.displayName = "Button"

export { Button } 
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './Button.scss'

type ButtonVariant = 'primary' | 'secondary'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  leadingIcon?: ReactNode
}

export function Button({
  children,
  className = '',
  leadingIcon,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  const classes = ['button', `button--${variant}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} type={type} {...props}>
      {leadingIcon && <span className="button__icon">{leadingIcon}</span>}
      <span className="button__label">{children}</span>
    </button>
  )
}

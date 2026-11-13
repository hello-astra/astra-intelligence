import type { ComponentProps, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { buttonStyles, iconButtonStyles, type ButtonSize, type ButtonVariant } from './button-styles'
import { Spinner } from './Spinner'

interface StyleProps {
  variant?: ButtonVariant
  size?: ButtonSize
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

type ButtonProps = StyleProps & ComponentProps<'button'> & { loading?: boolean }

export function Button({
  variant,
  size,
  leftIcon,
  rightIcon,
  loading,
  className,
  children,
  type = 'button',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : leftIcon}
      {children}
      {rightIcon}
    </button>
  )
}

export function ButtonLink({ variant, size, leftIcon, rightIcon, className, children, ...rest }: StyleProps & LinkProps) {
  return (
    <Link className={buttonStyles({ variant, size, className })} {...rest}>
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  )
}

/** For external URLs, mailto: and tel: links. */
export function ButtonAnchor({
  variant,
  size,
  leftIcon,
  rightIcon,
  className,
  children,
  ...rest
}: StyleProps & ComponentProps<'a'>) {
  return (
    <a className={buttonStyles({ variant, size, className })} {...rest}>
      {leftIcon}
      {children}
      {rightIcon}
    </a>
  )
}

type IconButtonProps = ComponentProps<'button'> & { label: string }

/** Square icon-only button. `label` is required for accessibility. */
export function IconButton({ label, className, children, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button type={type} aria-label={label} title={label} className={iconButtonStyles(className)} {...rest}>
      {children}
    </button>
  )
}

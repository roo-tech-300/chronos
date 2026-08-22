import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  isLoading?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      leftIcon,
      rightIcon,
      isLoading = false,
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'

    const variantStyles = {
      primary: 'bg-[#111827] hover:bg-black text-white shadow-sm border border-transparent',
      secondary: 'bg-zinc-100 hover:bg-zinc-200 text-[#111827] border border-zinc-200',
      outline: 'bg-white hover:bg-zinc-50 text-[#111827] border border-zinc-200 shadow-sm',
      ghost: 'bg-transparent hover:bg-zinc-100 text-zinc-600 hover:text-[#111827]',
      danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    }[variant]

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-6 py-3 gap-2.5',
      icon: 'p-2 w-9 h-9 gap-0 rounded-lg',
    }[size]

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${
          fullWidth ? 'w-full' : ''
        } ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary'
}

export const Button = ({ 
  children, 
  variant = 'primary', 
  className,
  ...props 
}: ButtonProps) => {
  return (
    <button
      className={twMerge(
        'px-4 py-2 rounded-lg font-medium transition-colors',
        variant === 'primary' 
          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
          : 'bg-gray-200 hover:bg-gray-300 text-gray-800',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

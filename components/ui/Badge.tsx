import { HTMLAttributes } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'red' | 'white' | 'blue' | 'black'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  // Team colors
  red: 'bg-red-500 text-white',
  white: 'bg-gray-100 text-gray-900 border border-gray-300',
  blue: 'bg-blue-500 text-white',
  black: 'bg-gray-900 text-white',
}

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  )
}

export function PositionBadge({ position }: { position: 'defender' | 'midfielder' | 'attacker' }) {
  const styles = {
    defender: 'bg-blue-100 text-blue-800',
    midfielder: 'bg-green-100 text-green-800',
    attacker: 'bg-red-100 text-red-800',
  }

  const labels = {
    defender: 'DEF',
    midfielder: 'MID',
    attacker: 'ATT',
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${styles[position]}`}
    >
      {labels[position]}
    </span>
  )
}

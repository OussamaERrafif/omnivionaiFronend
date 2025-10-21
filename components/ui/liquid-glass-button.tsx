"use client"

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const liquidGlassButtonVariants = cva(
  "relative group transition-all duration-300 ease-out overflow-hidden",
  {
    variants: {
      variant: {
        default: 'backdrop-blur-xl bg-primary/20 hover:bg-primary/30 border border-primary/40 shadow-2xl text-primary-foreground',
        outline: 'backdrop-blur-xl bg-background/10 hover:bg-background/20 border border-border/50 shadow-xl text-foreground',
        secondary: 'backdrop-blur-xl bg-secondary/20 hover:bg-secondary/30 border border-secondary/40 shadow-xl text-secondary-foreground',
        ghost: 'backdrop-blur-xl bg-transparent hover:bg-accent/20 border border-transparent shadow-lg text-foreground',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3',
        lg: 'h-10 px-6',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

interface LiquidGlassButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof liquidGlassButtonVariants> {
  asChild?: boolean
  children: React.ReactNode
}

function LiquidGlassButton({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: LiquidGlassButtonProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const centerX = rect.width / 2
        const centerY = rect.height / 2

        const angleX = (y - centerY) / 30
        const angleY = (centerX - x) / 30

        buttonRef.current.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale(1.02)`
      }
    }

    const handleMouseLeave = () => {
      if (buttonRef.current) {
        buttonRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)'
      }
    }

    const button = buttonRef.current
    if (button) {
      button.addEventListener('mousemove', handleMouseMove)
      button.addEventListener('mouseleave', handleMouseLeave)
    }

    return () => {
      if (button) {
        button.removeEventListener('mousemove', handleMouseMove)
        button.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [])

  const Comp = asChild ? Slot : 'button'

  if (asChild) {
    return (
      <Comp
        ref={buttonRef}
        className={cn(
          liquidGlassButtonVariants({ variant, size }),
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
        style={{ transformStyle: 'preserve-3d' }}
        {...props}
      >
        {children}
      </Comp>
    )
  }

  return (
    <Comp
      ref={buttonRef}
      className={cn(
        liquidGlassButtonVariants({ variant, size }),
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      style={{ transformStyle: 'preserve-3d' }}
      {...props}
    >
      {/* Inner Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-full dark:from-white/10" />

      {/* Shimmer Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out rounded-full dark:via-white/10" />

      {/* Button Content */}
      <div className="relative flex items-center gap-2 font-medium tracking-wide drop-shadow-sm">
        {children}
      </div>

      {/* Bottom Highlight */}
      <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-white/30 dark:bg-white/20" />

      {/* Outer Glow on Hover */}
      <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/5 dark:group-hover:bg-white/10 blur-xl transition-all duration-300 -z-10" />
    </Comp>
  )
}

export { LiquidGlassButton, liquidGlassButtonVariants }
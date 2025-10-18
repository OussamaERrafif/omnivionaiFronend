/**
 * Theme provider wrapper for next-themes.
 * 
 * This component wraps the next-themes ThemeProvider to enable
 * dark/light mode switching throughout the application. It handles:
 * - Theme persistence in localStorage
 * - System theme detection
 * - Theme attribute injection
 * - No-flash theme loading
 * 
 * Should be placed in the root layout to provide theme context to all components.
 * 
 * @module components/theme-provider
 */

'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

/**
 * ThemeProvider component - Enables theme switching.
 * 
 * Wraps next-themes provider to enable dark/light mode throughout the app.
 * 
 * @param props - Provider props including children and theme configuration
 * @returns React component
 * 
 * @example
 * ```tsx
 * // In root layout.tsx
 * <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
 *   {children}
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

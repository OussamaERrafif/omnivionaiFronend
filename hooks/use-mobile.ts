/**
 * Custom React hook for detecting mobile screen sizes.
 * 
 * This hook uses the matchMedia API to detect if the current viewport
 * is below the mobile breakpoint (768px). It listens for resize events
 * and updates the value reactively.
 * 
 * @module hooks/use-mobile
 */

import * as React from 'react'

/** Breakpoint width in pixels that defines mobile vs desktop */
const MOBILE_BREAKPOINT = 768

/**
 * Hook to detect if the current viewport is mobile-sized.
 * 
 * Uses window.matchMedia to efficiently track viewport size changes
 * and updates the returned boolean when crossing the mobile breakpoint.
 * 
 * @returns `true` if viewport width is less than 768px, `false` otherwise
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isMobile = useIsMobile();
 *   
 *   return (
 *     <div>
 *       {isMobile ? <MobileMenu /> : <DesktopMenu />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}

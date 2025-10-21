"use client"

import { useEffect, useRef } from "react"

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    setCanvasSize()
    window.addEventListener("resize", setCanvasSize)

    // Parallax scroll tracking
    let scrollY = 0
    const handleScroll = () => {
      scrollY = window.scrollY
    }
    window.addEventListener("scroll", handleScroll)

    // Particle system
    const particles: Array<{
      x: number
      y: number
      baseY: number
      vx: number
      vy: number
      size: number
      opacity: number
      depth: number
    }> = []

    // Create particles
    const particleCount = Math.min(100, Math.floor((canvas.width * canvas.height) / 10000))
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        baseY: Math.random() * canvas.height * 2, // Extend beyond viewport for parallax
        y: 0, // Will be calculated
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.1,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.6 + 0.1,
        depth: Math.random() * 0.8 + 0.1, // 0.1 to 0.9 for parallax effect
      })
    }

    // Animation loop
    let animationFrameId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particles.forEach((particle) => {
        // Apply parallax effect
        particle.y = particle.baseY - scrollY * particle.depth

        // Add subtle movement
        particle.x += particle.vx
        particle.y += particle.vy

        // Wrap around horizontally
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0

        // Reset vertical position if too far off screen (for infinite scroll effect)
        if (particle.y < -100) {
          particle.baseY += canvas.height * 2
        } else if (particle.y > canvas.height + 100) {
          particle.baseY -= canvas.height * 2
        }

        // Only draw particles that are visible
        if (particle.y >= -50 && particle.y <= canvas.height + 50) {
          // Draw particle with depth-based opacity
          const alpha = particle.opacity * (1 - particle.depth * 0.3) // Closer particles more opaque
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(147, 51, 234, ${alpha})`
          ctx.fill()

          // Draw connections to nearby particles
          particles.forEach((otherParticle) => {
            if (otherParticle === particle) return
            const dx = particle.x - otherParticle.x
            const dy = particle.y - otherParticle.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < 120 && Math.abs(particle.depth - otherParticle.depth) < 0.3) {
              ctx.beginPath()
              ctx.moveTo(particle.x, particle.y)
              ctx.lineTo(otherParticle.x, otherParticle.y)
              ctx.strokeStyle = `rgba(147, 51, 234, ${alpha * 0.3 * (1 - distance / 120)})`
              ctx.lineWidth = 0.5
              ctx.stroke()
            }
          })
        }
      })

      animationFrameId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener("resize", setCanvasSize)
      window.removeEventListener("scroll", handleScroll)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" aria-hidden="true" />
}

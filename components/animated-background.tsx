"use client"

import { useEffect, useRef } from "react"

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reducedMotion.matches) return

    const maxPixelRatio = 1.5
    let viewportWidth = 0
    let viewportHeight = 0

    const setCanvasSize = () => {
      viewportWidth = window.innerWidth
      viewportHeight = window.innerHeight
      const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio)
      canvas.width = Math.floor(viewportWidth * pixelRatio)
      canvas.height = Math.floor(viewportHeight * pixelRatio)
      canvas.style.width = `${viewportWidth}px`
      canvas.style.height = `${viewportHeight}px`
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }
    setCanvasSize()
    window.addEventListener("resize", setCanvasSize)

    let scrollY = 0
    const handleScroll = () => {
      scrollY = window.scrollY
    }
    window.addEventListener("scroll", handleScroll, { passive: true })

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

    const particleCount = Math.min(60, Math.floor((viewportWidth * viewportHeight) / 18000))
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * viewportWidth,
        baseY: Math.random() * viewportHeight * 2,
        y: 0,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.1,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.6 + 0.1,
        depth: Math.random() * 0.8 + 0.1,
      })
    }

    let animationFrameId: number
    const animate = () => {
      ctx.clearRect(0, 0, viewportWidth, viewportHeight)

      particles.forEach((particle) => {
        particle.y = particle.baseY - scrollY * particle.depth
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < 0) particle.x = viewportWidth
        if (particle.x > viewportWidth) particle.x = 0

        if (particle.y < -100) {
          particle.baseY += viewportHeight * 2
        } else if (particle.y > viewportHeight + 100) {
          particle.baseY -= viewportHeight * 2
        }

        if (particle.y >= -50 && particle.y <= viewportHeight + 50) {
          const alpha = particle.opacity * (1 - particle.depth * 0.3)
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(147, 51, 234, ${alpha})`
          ctx.fill()
        }
      })

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index]
        if (particle.y < -50 || particle.y > viewportHeight + 50) continue

        for (let otherIndex = index + 1; otherIndex < particles.length; otherIndex += 1) {
          const otherParticle = particles[otherIndex]
          if (Math.abs(particle.depth - otherParticle.depth) >= 0.3) continue

          const dx = particle.x - otherParticle.x
          const dy = particle.y - otherParticle.y
          const distanceSquared = dx * dx + dy * dy
          const connectionDistance = 120
          if (distanceSquared >= connectionDistance * connectionDistance) continue

          const distance = Math.sqrt(distanceSquared)
          const alpha = particle.opacity * (1 - particle.depth * 0.3)
          ctx.beginPath()
          ctx.moveTo(particle.x, particle.y)
          ctx.lineTo(otherParticle.x, otherParticle.y)
          ctx.strokeStyle = `rgba(147, 51, 234, ${alpha * 0.3 * (1 - distance / connectionDistance)})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }

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

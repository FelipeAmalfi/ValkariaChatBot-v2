'use client'
import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vy: number
  vx: number
  radius: number
  opacity: number
  color: string
}

const COLORS = ['#c9a84c', '#9a5fff', '#bb94ff', '#c9a84c']

function createParticle(canvas: HTMLCanvasElement): Particle {
  return {
    x: Math.random() * canvas.width,
    y: canvas.height + Math.random() * 100,
    vy: -(0.3 + Math.random() * 0.5),
    vx: (Math.random() - 0.5) * 0.3,
    radius: 1 + Math.random() * 2,
    opacity: 0.1 + Math.random() * 0.25,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }
}

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Particle[] = Array.from({ length: 20 }, () => createParticle(canvas))

    function onResize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    let rafId: number

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.y += p.vy
        p.x += p.vx

        if (p.y < -10) {
          particles[i] = createParticle(canvas!)
          continue
        }

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx!.fillStyle = p.color
        ctx!.globalAlpha = p.opacity
        ctx!.fill()
      }

      ctx!.globalAlpha = 1
      rafId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  )
}

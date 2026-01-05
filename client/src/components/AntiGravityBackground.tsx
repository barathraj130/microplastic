import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  size: number
  speedY: number
  speedX: number
  opacity: number
  color: string
  sway: number
  swaySpeed: number
}

const COLORS = [
  "rgba(255, 255, 255,", // White
  "rgba(0, 123, 255,",   // Blue
  "rgba(34, 211, 238,",  // Cyan
  "rgba(255, 140, 0,",   // Orange
]

const PARTICLE_COUNT = 60

export function AntiGravityBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const particlesRef = useRef<Particle[]>([])

  const createParticle = (w: number, h: number): Particle => {
    const size = Math.random() * 3 + 1
    const depth = size / 4
    const colorIndex = Math.random() > 0.1 ? Math.floor(Math.random() * 3) : 3

    return {
      x: Math.random() * w,
      y: Math.random() * h,
      size,
      speedY: -(Math.random() * 0.5 + 0.2) * depth,
      speedX: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.5 + 0.2,
      color: COLORS[colorIndex],
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.02 + 0.01,
    }
  }

  const initParticles = (w: number, h: number) => {
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
      createParticle(w, h)
    )
  }

  const animate = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number
  ) => {
    ctx.clearRect(0, 0, w, h)

    particlesRef.current.forEach(p => {
      p.y += p.speedY
      p.sway += p.swaySpeed
      p.x += p.speedX + Math.sin(p.sway) * 0.5

      if (p.y < -p.size) {
        p.y = h + p.size
        p.x = Math.random() * w
      }
      if (p.x < -p.size) p.x = w + p.size
      if (p.x > w + p.size) p.x = -p.size

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `${p.color}${p.opacity})`

      if (p.size > 2) {
        ctx.shadowBlur = p.size * 2
        ctx.shadowColor = `${p.color}0.3)`
      } else {
        ctx.shadowBlur = 0
      }

      ctx.fill()
    })

    rafRef.current = requestAnimationFrame(() =>
      animate(ctx, w, h)
    )
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initParticles(canvas.width, canvas.height)
    }

    resize()
    window.addEventListener("resize", resize)

    rafRef.current = requestAnimationFrame(() =>
      animate(ctx, canvas.width, canvas.height)
    )

    return () => {
      window.removeEventListener("resize", resize)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return (
    <div className="absolute inset-0 -z-10 pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  )
}

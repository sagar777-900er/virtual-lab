import { useEffect, useRef } from 'react'
import Matter from 'matter-js'

const { Composite } = Matter

/**
 * AnalyticsOverlay draws velocity vector arrows on top of the physics canvas.
 * It renders into its own canvas layer that sits on top of the Matter.js canvas.
 */
const AnalyticsOverlay = ({ engine, isVisible }) => {
  const overlayRef = useRef(null)
  const animFrameRef = useRef(null)

  useEffect(() => {
    if (!isVisible || !engine) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      // Clear the canvas when hidden
      const ctx = overlayRef.current?.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      return
    }

    const canvas = overlayRef.current
    if (!canvas) return

    const draw = () => {
      const parent = canvas.parentElement
      if (!parent) return

      const w = parent.clientWidth
      const h = parent.clientHeight
      const dpr = window.devicePixelRatio || 1

      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'

      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, w, h)

      const bodies = Composite.allBodies(engine.world)

      bodies.forEach((body) => {
        if (body.isStatic) return

        const { x, y } = body.position
        const vx = body.velocity.x
        const vy = body.velocity.y
        const speed = body.speed

        if (speed < 0.3) return

        // Velocity vector arrow
        const scale = 8
        const endX = x + vx * scale
        const endY = y + vy * scale

        // Arrow line
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(endX, endY)
        ctx.strokeStyle = speed > 5 ? '#f43f5e' : speed > 2 ? '#f59e0b' : '#06b6d4'
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.8
        ctx.stroke()

        // Arrowhead
        const angle = Math.atan2(vy, vx)
        const headLen = 8
        ctx.beginPath()
        ctx.moveTo(endX, endY)
        ctx.lineTo(
          endX - headLen * Math.cos(angle - Math.PI / 6),
          endY - headLen * Math.sin(angle - Math.PI / 6)
        )
        ctx.moveTo(endX, endY)
        ctx.lineTo(
          endX - headLen * Math.cos(angle + Math.PI / 6),
          endY - headLen * Math.sin(angle + Math.PI / 6)
        )
        ctx.stroke()

        // Speed label
        ctx.globalAlpha = 0.7
        ctx.fillStyle = '#ffffff'
        ctx.font = '9px "Space Grotesk", monospace'
        ctx.fillText(`${speed.toFixed(1)} m/s`, x + 10, y - 10)

        ctx.globalAlpha = 1
      })

      animFrameRef.current = requestAnimationFrame(draw)
    }

    animFrameRef.current = requestAnimationFrame(draw)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [engine, isVisible])

  if (!isVisible) return null

  return (
    <canvas
      ref={overlayRef}
      className="absolute inset-0 z-30 pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  )
}

export default AnalyticsOverlay

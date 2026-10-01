import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGround } from '../lib/groundContext.jsx'
import { getPoemPool, pickPoem } from '../lib/poems.js'

const GROUND_PALETTES = {
  madder: {
    bg: '#6f241b',
    bg2: '#7d2a20',
    ink: '#efe3c8',
    sub: '#d8b9a2',
    cream: '#efe3c8',
    ochre: '#dfae4f',
    coral: '#e0916f',
    rose: '#d9a98e',
    sage: '#a3ab7d',
    blue: '#93a8bf',
    deep: '#43130c',
    line: 'rgba(239,227,200,0.2)'
  },
  indigo: {
    bg: '#171b2c',
    bg2: '#1e2338',
    ink: '#e9dcc0',
    sub: '#9aa0b0',
    cream: '#e9dcc0',
    ochre: '#d7a445',
    coral: '#cf7a63',
    rose: '#d99a86',
    sage: '#97a878',
    blue: '#7f9ab8',
    deep: '#0b0e19',
    line: 'rgba(233,220,192,0.16)'
  },
  paper: {
    bg: '#eee1c6',
    bg2: '#e5d5b4',
    ink: '#332b30',
    sub: '#87796a',
    cream: '#332b30',
    ochre: '#a5432f',
    coral: '#b85a41',
    rose: '#a86a4e',
    sage: '#66804e',
    blue: '#47648e',
    deep: '#cdbc99',
    line: 'rgba(51,43,48,0.18)'
  }
}

function setupCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = canvas.offsetWidth
  const height = canvas.offsetHeight
  canvas.width = width * dpr
  canvas.height = height * dpr
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, width, height }
}

function hexAlpha(hex, alpha) {
  const red = parseInt(hex.slice(1, 3), 16)
  const green = parseInt(hex.slice(3, 5), 16)
  const blue = parseInt(hex.slice(5, 7), 16)
  return `rgba(${red},${green},${blue},${alpha})`
}

function tendril(x0, y0, heading, length, options) {
  const count = options.N || 220
  const points = [[x0, y0]]
  let angle = heading
  let x = x0
  let y = y0
  const step = length / count

  for (let index = 1; index <= count; index += 1) {
    const t = index / count
    angle += (options.wobble || 0) * Math.sin(t * Math.PI * (options.waves || 2) + (options.phase || 0))
      + (options.curl || 0) * t ** 3
      + (options.bend || 0)
    x += Math.cos(angle) * step
    y += Math.sin(angle) * step
    points.push([x, y])
  }

  return points
}

function strokeTapered(ctx, points, drawnCount, baseWidth, color, alpha) {
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  const count = points.length - 1

  for (let index = 1; index <= drawnCount; index += 1) {
    const t = Math.min(index / count, 0.999)
    let width = baseWidth * Math.sin(Math.PI * t) ** 0.55
    const tip = drawnCount - index
    if (tip < 10) width *= tip / 10
    if (width < 0.25) continue

    ctx.globalAlpha = alpha
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(points[index - 1][0], points[index - 1][1])
    ctx.lineTo(points[index][0], points[index][1])
    ctx.stroke()
  }

  ctx.globalAlpha = 1
}

function blossom(ctx, x, y, scale, petal, center, rotation = 0) {
  if (scale <= 0) return

  const tau = Math.PI * 2
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)

  for (let index = 0; index < 5; index += 1) {
    const angle = index * tau / 5 - Math.PI / 2
    ctx.beginPath()
    ctx.ellipse(Math.cos(angle) * 3.4 * scale, Math.sin(angle) * 3.4 * scale, 2.8 * scale, 1.8 * scale, angle, 0, tau)
    ctx.fillStyle = petal
    ctx.fill()
  }

  ctx.beginPath()
  ctx.arc(0, 0, 1.7 * scale, 0, tau)
  ctx.fillStyle = center
  ctx.fill()
  ctx.restore()
}

function diamond(ctx, x, y, size, color, alpha) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(Math.PI / 4)
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.fillRect(-size / 2, -size / 2, size, size)
  ctx.restore()
  ctx.globalAlpha = 1
}

function buildScene(width, height, palette) {
  const tau = Math.PI * 2
  const rand = (min, max) => min + Math.random() * (max - min)
  const scene = { motifs: [], field: [], winds: [], blossoms: [], petals: [], width, height, palette }
  const margin = Math.max(22, Math.min(width, height) * 0.035)
  scene.margin = margin
  const inset = margin + 16
  const borderStep = 34
  const perimeter = []

  for (let x = inset; x <= width - inset; x += borderStep) perimeter.push([x, margin + 8])
  for (let y = inset; y <= height - inset; y += borderStep) perimeter.push([width - margin - 8, y])
  for (let x = width - inset; x >= inset; x -= borderStep) perimeter.push([x, height - margin - 8])
  for (let y = height - inset; y >= inset; y -= borderStep) perimeter.push([margin + 8, y])

  perimeter.forEach((point, index) => scene.motifs.push({
    x: point[0],
    y: point[1],
    kind: index % 4 === 0 ? 'blossom' : 'diamond',
    color: index % 4 === 0 ? palette.ochre : (index % 2 ? palette.coral : palette.sage),
    delay: 250 + (index / perimeter.length) * 1400
  }))

  const fieldCount = Math.floor(width * height / 16000)
  for (let index = 0; index < fieldCount; index += 1) {
    const x = rand(margin * 2, width - margin * 2)
    const y = rand(margin * 2, height - margin * 2)
    const dx = (x - width / 2) / (width * 0.36)
    const dy = (y - height / 2) / (height * 0.30)
    if (dx * dx + dy * dy < 1) continue

    scene.field.push({
      x,
      y,
      kind: Math.random() < 0.55 ? 'floret' : 'curl',
      rot: rand(0, tau),
      scale: rand(0.5, 1.1),
      delay: rand(600, 2200)
    })
  }

  const seeds = [
    [width * 0.10, height * 0.92, rand(-1.9, -1.2)],
    [width * 0.90, height * 0.92, rand(-2.0, -1.3)],
    [width * 0.05, height * 0.30, rand(-0.5, 0.2)],
    [width * 0.95, height * 0.28, rand(2.9, 3.6)]
  ]
  const inks = [palette.cream, palette.ochre, palette.coral, palette.sage, palette.blue]
  let colorIndex = 0

  seeds.forEach(([seedX, seedY, seedHeading]) => {
    for (let index = 0; index < 3; index += 1) {
      const points = tendril(
        seedX + rand(-10, 10),
        seedY + rand(-10, 10),
        seedHeading + rand(-0.25, 0.25),
        rand(0.30, 0.5) * Math.min(width, height) * 1.3,
        {
          wobble: rand(0.004, 0.011),
          waves: rand(1.5, 3),
          phase: rand(0, tau),
          curl: rand(0.02, 0.05) * (Math.random() < 0.5 ? -1 : 1),
          N: 220
        }
      )
      const delay = 500 + rand(0, 700) + colorIndex * 70
      const duration = rand(1600, 2200)

      scene.winds.push({
        points,
        delay,
        duration,
        color: inks[colorIndex % inks.length],
        width: rand(2.0, 4.2),
        alpha: rand(0.5, 0.8)
      })

      if (Math.random() < 0.8) {
        const fraction = rand(0.6, 0.95)
        const pointIndex = Math.floor(fraction * (points.length - 1))
        scene.blossoms.push({
          x: points[pointIndex][0],
          y: points[pointIndex][1],
          time: delay + fraction * duration + 100,
          scale: rand(0.8, 1.4),
          rot: rand(0, tau),
          petal: Math.random() < 0.5 ? palette.coral : palette.ochre,
          center: palette.cream
        })
      }

      colorIndex += 1
    }
  })

  for (let index = 0; index < 7; index += 1) {
    scene.petals.push({
      x: rand(margin * 2, width - margin * 2),
      y: rand(0, height),
      speed: rand(0.006, 0.014),
      phase: rand(0, tau),
      scale: rand(0.45, 0.85),
      petal: Math.random() < 0.5 ? palette.coral : palette.ochre
    })
  }

  return scene
}

function drawScene(ctx, scene, elapsed) {
  const { width, height, palette, margin } = scene
  const tau = Math.PI * 2
  const easeOut = (progress) => 1 - (1 - progress) ** 3
  const clamp01 = (value) => Math.min(1, Math.max(0, value))

  ctx.clearRect(0, 0, width, height)

  const mandalaProgress = easeOut(clamp01((elapsed - 800) / 1000))
  if (mandalaProgress > 0) {
    const centerX = width / 2
    const centerY = height / 2 - 40
    const radius = Math.min(width, height) * 0.30 * (0.92 + 0.08 * mandalaProgress)

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(elapsed * 0.000015)
    ctx.strokeStyle = palette.cream
    ctx.lineWidth = 1.1
    ctx.globalAlpha = (0.06 + 0.02 * Math.sin(elapsed * 0.0006)) * mandalaProgress
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, tau)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(0, 0, radius * 0.6, 0, tau)
    ctx.stroke()

    for (let index = 0; index < 12; index += 1) {
      const angle = index * tau / 12
      ctx.beginPath()
      ctx.ellipse(Math.cos(angle) * radius, Math.sin(angle) * radius, radius * 0.2, radius * 0.09, angle, 0, tau)
      ctx.stroke()
    }

    for (let index = 0; index < 8; index += 1) {
      const angle = index * tau / 8 + tau / 16
      diamond(ctx, Math.cos(angle) * radius * 0.6, Math.sin(angle) * radius * 0.6, 5, palette.ochre, 0.10 * mandalaProgress)
    }

    ctx.restore()
    ctx.globalAlpha = 1
  }

  const frameProgress = easeOut(clamp01(elapsed / 900))
  ctx.globalAlpha = frameProgress
  ctx.strokeStyle = palette.ochre
  ctx.lineWidth = 1.6
  ctx.strokeRect(margin, margin, width - 2 * margin, height - 2 * margin)
  ctx.strokeStyle = palette.line
  ctx.lineWidth = 1
  ctx.strokeRect(margin + 16, margin + 16, width - 2 * (margin + 16), height - 2 * (margin + 16))
  ctx.globalAlpha = 1

  scene.motifs.forEach((motif) => {
    const progress = easeOut(clamp01((elapsed - motif.delay) / 350))
    if (progress <= 0) return
    if (motif.kind === 'blossom') {
      blossom(ctx, motif.x, motif.y, 0.85 * progress, motif.color, palette.cream)
    } else {
      diamond(ctx, motif.x, motif.y, 7 * progress, motif.color, 0.85)
    }
  })

  const cornerProgress = easeOut(clamp01((elapsed - 1500) / 500))
  ;[
    [margin + 16, margin + 16],
    [width - margin - 16, margin + 16],
    [margin + 16, height - margin - 16],
    [width - margin - 16, height - margin - 16]
  ].forEach(([x, y]) => blossom(ctx, x, y, 1.5 * cornerProgress, palette.ochre, palette.coral, Math.PI / 5))

  scene.field.forEach((field) => {
    const progress = clamp01((elapsed - field.delay) / 600)
    if (progress <= 0) return

    ctx.save()
    ctx.translate(field.x, field.y)
    ctx.rotate(field.rot)
    ctx.globalAlpha = 0.09 * progress

    if (field.kind === 'floret') {
      for (let index = 0; index < 4; index += 1) {
        const angle = index * tau / 4
        ctx.beginPath()
        ctx.arc(Math.cos(angle) * 4 * field.scale, Math.sin(angle) * 4 * field.scale, 1.8 * field.scale, 0, tau)
        ctx.fillStyle = palette.cream
        ctx.fill()
      }
    } else {
      ctx.strokeStyle = palette.cream
      ctx.lineWidth = 1.1
      ctx.beginPath()
      ctx.arc(0, 0, 6 * field.scale, 0, Math.PI * 1.4)
      ctx.stroke()
    }

    ctx.restore()
    ctx.globalAlpha = 1
  })

  scene.winds.forEach((wind) => {
    const progress = easeOut(clamp01((elapsed - wind.delay) / wind.duration))
    const drawnCount = Math.floor(progress * (wind.points.length - 1))
    if (drawnCount > 1) strokeTapered(ctx, wind.points, drawnCount, wind.width, wind.color, wind.alpha)
  })

  scene.blossoms.forEach((flower) => {
    const progress = easeOut(clamp01((elapsed - flower.time) / 450))
    blossom(ctx, flower.x, flower.y, flower.scale * progress, flower.petal, flower.center, flower.rot)
  })

  if (elapsed > 2600) {
    scene.petals.forEach((petal) => {
      const y = ((petal.y + (elapsed - 2600) * petal.speed) % (height + 80) + (height + 80)) % (height + 80) - 40
      const x = petal.x + Math.sin(elapsed * 0.0004 + petal.phase) * 26
      ctx.globalAlpha = 0.5
      blossom(ctx, x, y, petal.scale, petal.petal, palette.cream, elapsed * 0.0003 + petal.phase)
      ctx.globalAlpha = 1
    })
  }

  const vignette = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.35, width / 2, height / 2, Math.max(width, height) * 0.75)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, hexAlpha(palette.deep, 0.55))
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, width, height)
}

function drawGrain(canvas) {
  if (!canvas || canvas.offsetWidth === 0) return

  const { ctx, width, height } = setupCanvas(canvas)
  const tile = document.createElement('canvas')
  tile.width = 128
  tile.height = 128
  const tileCtx = tile.getContext('2d')
  const image = tileCtx.createImageData(128, 128)

  for (let index = 0; index < image.data.length; index += 4) {
    const value = Math.floor(Math.random() * 255)
    image.data[index] = value
    image.data[index + 1] = value
    image.data[index + 2] = value
    image.data[index + 3] = 255
  }

  tileCtx.putImageData(image, 0, 0)
  ctx.fillStyle = ctx.createPattern(tile, 'repeat')
  ctx.fillRect(0, 0, width, height)
}

function revealIntro(root) {
  if (!root) return

  const words = root.querySelectorAll('[data-w]')
  words.forEach((element, index) => {
    element.animate(
      [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
      { duration: 700, delay: 1450 + index * 90, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' }
    )
  })

  const pops = root.querySelectorAll('[data-pop]')
  pops.forEach((element, index) => {
    element.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 800, delay: 2200 + index * 140, easing: 'ease', fill: 'both' }
    )
  })
}

function renderLine(line, highlight) {
  const highlightWords = new Set(String(highlight || '').split(/\s+/).filter(Boolean))

  return String(line || '').split(/\s+/).filter(Boolean).map((word, index) => (
    <span
      className={highlightWords.has(word) ? 'highlight-word' : undefined}
      data-w=""
      key={`${word}-${index}`}
    >
      {word}
    </span>
  ))
}

export default function DivanIntro({ onEnter, skipKey }) {
  const { ground, cycleGround } = useGround()
  const [poem, setPoem] = useState(() => pickPoem())
  const [skipNextTime, setSkipNextTime] = useState(
    () => window.localStorage.getItem(skipKey) === 'true'
  )
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const grainRef = useRef(null)
  const posterIdRef = useRef(0)
  const resizeTimerRef = useRef(0)
  const poemCount = useMemo(() => getPoemPool().length, [])
  const palette = GROUND_PALETTES[ground] || GROUND_PALETTES.madder

  const runPoster = useCallback((tries = 0) => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (canvas.offsetWidth === 0) {
      if (tries < 150) window.requestAnimationFrame(() => runPoster(tries + 1))
      return
    }

    const currentId = posterIdRef.current + 1
    posterIdRef.current = currentId
    const { ctx, width, height } = setupCanvas(canvas)
    const scene = buildScene(width, height, palette)
    drawGrain(grainRef.current)
    revealIntro(rootRef.current)
    const start = performance.now()

    const step = (now) => {
      if (currentId !== posterIdRef.current || !canvas.isConnected) return
      drawScene(ctx, scene, now - start)
      window.requestAnimationFrame(step)
    }

    window.requestAnimationFrame(step)
  }, [palette])

  const handleEnter = useCallback(() => {
    if (skipNextTime) {
      window.localStorage.setItem(skipKey, 'true')
    } else {
      window.localStorage.removeItem(skipKey)
    }

    onEnter()
  }, [onEnter, skipKey, skipNextTime])

  useEffect(() => {
    runPoster()

    const onResize = () => {
      window.clearTimeout(resizeTimerRef.current)
      resizeTimerRef.current = window.setTimeout(() => runPoster(), 240)
    }

    window.addEventListener('resize', onResize)
    return () => {
      posterIdRef.current += 1
      window.clearTimeout(resizeTimerRef.current)
      window.removeEventListener('resize', onResize)
    }
  }, [poem, runPoster])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Enter') {
        handleEnter()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleEnter])

  return (
    <main className="divan-screen" ref={rootRef}>
      <canvas className="intro-ornament-canvas" ref={canvasRef} aria-hidden="true" />
      <canvas className="intro-grain-canvas" ref={grainRef} aria-hidden="true" />

      <div className="corner-stamp" aria-hidden="true" data-pop="">
        <span>LIFE OS</span>
        <small>a private ledger</small>
      </div>

      <section className="poem-stage" aria-label="Divan intro poem">
        <div className="poem-lines" lang="fa" dir="rtl">
          {poem.lines.map((line, index) => (
            <p key={`${line}-${index}`}>{renderLine(line, poem.hi)}</p>
          ))}
        </div>
        <p className="poet-name" data-pop="">{poem.poet}</p>
        {poem.en ? <p className="poem-translation" data-pop="">{poem.en}</p> : null}
      </section>

      <div className="intro-controls" data-pop="">
        <button className="primary-pill" type="button" onClick={handleEnter}>
          Enter
        </button>
        <button className="ghost-pill" type="button" onClick={() => setPoem(pickPoem())}>
          New poem
        </button>
        <button className="ghost-pill" type="button" onClick={cycleGround}>
          Ground: {ground}
        </button>
        <label className="skip-control">
          <input
            type="checkbox"
            checked={skipNextTime}
            onChange={(event) => setSkipNextTime(event.target.checked)}
          />
          <span>Skip intro next time</span>
        </label>
      </div>

      <p className="divan-foot" data-pop="">divan / {poemCount} poems offline / the door of life os</p>
    </main>
  )
}

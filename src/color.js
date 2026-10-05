const HEX = /^#[0-9a-f]{6}$/i

export function isHexColor(value) {
  return typeof value === 'string' && HEX.test(value)
}

function channels(hex) {
  const value = hex.toLowerCase()
  return [1, 3, 5].map((index) => parseInt(value.slice(index, index + 2), 16))
}

function toHex(channels) {
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

function luminance(hex) {
  const linear = channels(hex).map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

export function contrastRatio(foreground, background) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

function mix(from, toward, amount) {
  const start = channels(from)
  const end = channels(toward)
  return toHex(start.map((channel, index) => Math.round(channel + (end[index] - channel) * amount)))
}

export function ensureContrast(foreground, background, minimum = 4.5) {
  if (!isHexColor(foreground) || !isHexColor(background)) return foreground
  if (contrastRatio(foreground, background) >= minimum) return foreground.toLowerCase()
  let best = foreground.toLowerCase()
  let bestRatio = contrastRatio(best, background)
  for (const target of ['#000000', '#ffffff']) {
    for (let step = 1; step <= 20; step += 1) {
      const candidate = mix(foreground, target, step / 20)
      const ratio = contrastRatio(candidate, background)
      if (ratio > bestRatio) {
        best = candidate
        bestRatio = ratio
      }
      if (ratio >= minimum) return candidate
    }
  }
  const dark = contrastRatio('#182019', background)
  const light = contrastRatio('#ffffff', background)
  if (bestRatio >= dark && bestRatio >= light) return best
  return dark >= light ? '#182019' : '#ffffff'
}

export function readableForeground(background) {
  const dark = '#182019'
  const light = '#ffffff'
  return contrastRatio(light, background) >= contrastRatio(dark, background) ? light : dark
}

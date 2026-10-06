import { LIMITS } from './records.js'

const ICON_SIZE = 64

export function readLinkIcon(file) {
  return new Promise((resolve) => {
    if (!file || typeof file.type !== 'string' || !file.type.startsWith('image/')) {
      resolve({ ok: false, error: 'Choose an image file.' })
      return
    }
    const url = URL.createObjectURL(file)
    const image = new window.Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = ICON_SIZE
      canvas.height = ICON_SIZE
      const context = canvas.getContext('2d')
      if (!context || !image.width || !image.height) {
        resolve({ ok: false, error: 'That image could not be read.' })
        return
      }
      const scale = Math.max(ICON_SIZE / image.width, ICON_SIZE / image.height)
      const width = image.width * scale
      const height = image.height * scale
      context.drawImage(image, (ICON_SIZE - width) / 2, (ICON_SIZE - height) / 2, width, height)
      let quality = 0.82
      let data = canvas.toDataURL('image/jpeg', quality)
      while (data.length > LIMITS.linkIcon && quality > 0.45) {
        quality = Math.round((quality - 0.1) * 100) / 100
        data = canvas.toDataURL('image/jpeg', quality)
      }
      if (data.length > LIMITS.linkIcon) {
        resolve({ ok: false, error: 'That image is too large.' })
        return
      }
      resolve({ ok: true, value: data })
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ ok: false, error: 'That image could not be read.' })
    }
    image.src = url
  })
}

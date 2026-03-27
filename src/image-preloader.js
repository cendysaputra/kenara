import { getBackgroundForScreen, getScreenData } from './scene-manager.js'

const imageLoadCache = new Map()

function preloadImage(src) {
  if (!src) return Promise.resolve(null)

  if (imageLoadCache.has(src)) {
    return imageLoadCache.get(src)
  }

  const promise = new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(src)
    img.onerror = reject
    img.src = src
  }).catch(() => null)

  imageLoadCache.set(src, promise)
  return promise
}

function hasVisualBackground(screen) {
  return Boolean(screen?.background)
}

export function preloadInitialScenes(count = 4) {
  const screens = getScreenData()
  const initialVisuals = screens
    .filter(hasVisualBackground)
    .slice(0, count)

  initialVisuals.forEach(screen => {
    preloadImage(getBackgroundForScreen(screen))
  })
}

export function preloadNearbyScenes(currentIndex, lookAhead = 2) {
  const screens = getScreenData()

  for (let index = currentIndex + 1; index <= currentIndex + lookAhead; index += 1) {
    const screen = screens[index]
    if (!hasVisualBackground(screen)) continue
    preloadImage(getBackgroundForScreen(screen))
  }
}

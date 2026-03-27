import { screens } from './data/screens.js'

const imageModules = import.meta.glob('../assets/img/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default'
})

const imageAssetMap = new Map(
  Object.entries(imageModules).map(([path, assetUrl]) => [path.split('/').pop(), assetUrl])
)

export function getTotalScreens() {
  return screens.length
}

export function getScreenData() {
  return screens
}

function isMobile() {
  return window.innerWidth < 768
}

function resolveAssetUrl(assetPath) {
  if (!assetPath) return null

  const fileName = assetPath.split('/').pop()
  return imageAssetMap.get(fileName) || assetPath
}

function assetExists(assetPath) {
  if (!assetPath) return false
  return imageAssetMap.has(assetPath.split('/').pop())
}

export function getBackgroundForScreen(data) {
  if (isMobile() && data.backgroundMobile && assetExists(data.backgroundMobile)) {
    return resolveAssetUrl(data.backgroundMobile)
  }

  return resolveAssetUrl(data.background)
}

export function getChapterForScreenIndex(index) {
  const screen = screens[index]
  if (!screen) return null
  if (screen.type === 'hero' || screen.type === 'ending') return null
  return screen.chapter || null
}

export function getFirstScreenIndexForChapter(chapter) {
  return screens.findIndex(s => s.type === 'chapter-card' && s.chapter === chapter)
}

export function renderScreens(container) {
  screens.forEach((data, index) => {
    let el

    switch (data.type) {
      case 'hero':
        el = renderHero(data, index)
        break
      case 'chapter-card':
        el = renderChapterCard(data, index)
        break
      case 'scene':
        el = renderScene(data, index)
        break
      case 'ending':
        el = renderEnding(data, index)
        break
    }

    if (el) {
      el.dataset.index = index
      container.appendChild(el)
    }
  })

  return screens.length
}

function renderHero(data, index) {
  const el = document.createElement('div')
  el.className = `screen screen-hero ${index === 0 ? 'active' : ''}`
  
  // Keep original image as fallback or placeholder
  el.style.backgroundImage = `url('${getBackgroundForScreen(data)}')`

  let videoHTML = ''
  if (data.youtubeId) {
    // Autoplay requires mute=1.
    // modestbranding=1, controls=0, rel=0 to hide youtube UI.
    // loop=1 and playlist=[id] for continuous looping.
    const ytUrl = `https://www.youtube.com/embed/${data.youtubeId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${data.youtubeId}&playsinline=1`
    videoHTML = `
      <div class="hero-video-bg">
        <iframe src="${ytUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
      </div>
    `
  } else if (data.video) {
    videoHTML = `
      <div class="hero-video-bg">
        <video src="${data.video}" autoplay loop muted playsinline></video>
      </div>
    `
  }

  const currentYear = new Date().getFullYear()

  el.innerHTML = `
    ${videoHTML}
    <div class="hero-content">
      <p class="hero-subtitle">${data.subtitle}</p>
      <h1 class="hero-title">${data.title}</h1>
      <button class="hero-start-btn" onclick="window.scrollToScreen(1); if(window.playThemeAudio) window.playThemeAudio();">
        <span class="btn-text">Start Story</span>
        <span class="btn-icon">→</span>
      </button>
    </div>
    <div class="hero-copyright">&copy; ${currentYear} Cendy Saputra</div>
  `
  return el
}

function renderChapterCard(data, index) {
  const el = document.createElement('div')
  el.className = `screen screen-chapter-card ${data.variant || 'default'}`
  el.dataset.chapter = data.chapter

  el.innerHTML = `
    <span class="chapter-card-label">Chapter ${data.chapter}</span>
    <h2 class="chapter-card-title">${data.chapterTitle}</h2>
  `
  return el
}

function renderScene(data, index) {
  const el = document.createElement('div')
  el.className = 'screen screen-scene'
  el.dataset.chapter = data.chapter
  el.dataset.scene = data.scene
  el.dataset.textPosition = data.textPosition
  el.style.backgroundImage = `url('${getBackgroundForScreen(data)}')`

  el.innerHTML = `
    <div class="scene-text">
      <p class="scene-body">${data.text}</p>
    </div>
    <div class="mobile-scroll-hint" aria-hidden="true">Scroll down</div>
  `
  return el
}

function renderEnding(data, index) {
  const el = document.createElement('div')
  el.className = 'screen screen-ending'

  const currentYear = new Date().getFullYear()

  el.innerHTML = `
    <button class="ending-favicon" onclick="if(window.stopThemeAudio) window.stopThemeAudio(); window.scrollToScreen(0)" aria-label="Back to start">
      <img src="/assets/img/favicon.png" alt="Favicon" />
    </button>
    <p class="ending-text">${data.text}</p>
    <p class="ending-credit">${data.credit}</p>
    <div class="ending-copyright">&copy; ${currentYear} Cendy Saputra</div>
  `
  return el
}

let currentIsMobile = isMobile()

window.addEventListener('resize', () => {
  const nowMobile = isMobile()
  if (nowMobile !== currentIsMobile) {
    currentIsMobile = nowMobile
    document.querySelectorAll('.screen-scene, .screen-hero').forEach(el => {
      const index = parseInt(el.dataset.index)
      const data = getScreenData()[index]
      if (data) {
        el.style.backgroundImage = `url('${getBackgroundForScreen(data)}')`
      }
    })
  }
})

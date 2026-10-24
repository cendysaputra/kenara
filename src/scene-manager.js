import { screens } from './data/screens.js'

export function getTotalScreens() {
  return screens.length
}

export function getScreenData() {
  return screens
}

function isMobile() {
  return window.innerWidth < 768
}

export function getBackgroundForScreen(data) {
  if (isMobile() && data.backgroundMobile) return data.backgroundMobile
  return data.background || null
}

// Hero: webp animasi menggantikan cover setelah selesai dimuat.
function loadHeroAnim(el, data) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const anim = isMobile() ? data.backgroundAnimMobile : data.backgroundAnim
  if (!anim) return
  const img = new Image()
  img.onload = () => {
    // Abaikan jika viewport sudah berganti mode saat memuat.
    const current = isMobile() ? data.backgroundAnimMobile : data.backgroundAnim
    if (current !== anim) return
    el.style.backgroundImage = `url('${anim}'), url('${getBackgroundForScreen(data)}')`
  }
  img.src = anim
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

// Lazyload: pasang background hanya untuk layar di sekitar posisi aktif.
export function loadImagesAround(index, lookBehind = 1, lookAhead = 2) {
  const allScreenEls = document.querySelectorAll('.screen')
  const start = Math.max(index - lookBehind, 0)
  const end = Math.min(index + lookAhead, allScreenEls.length - 1)

  for (let i = start; i <= end; i++) {
    const el = allScreenEls[i]
    if (!el || !el.dataset.bg) continue
    el.style.backgroundImage = `url('${el.dataset.bg}')`
    delete el.dataset.bg
    if (el.classList.contains('screen-hero')) loadHeroAnim(el, screens[parseInt(el.dataset.index)])
  }
}

// Video hero baru dimuat (dan diputar) saat hero aktif.
let heroVideoPauseId = null

export function setHeroVideoActive(active) {
  const video = document.querySelector('.screen-hero video')
  if (!video) return
  window.clearTimeout(heroVideoPauseId)

  if (active) {
    if (video.dataset.src) {
      video.src = video.dataset.src
      delete video.dataset.src
    }
    video.play().catch(() => {})
    return
  }

  // Tunggu transisi keluar hero selesai.
  heroVideoPauseId = window.setTimeout(() => video.pause(), 1200)
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

  // Gambar tetap jadi fallback.
  el.dataset.bg = getBackgroundForScreen(data)

  let videoHTML = ''
  if (data.video) {
    videoHTML = `
      <div class="hero-video-bg">
        <video data-src="${data.video}" loop muted playsinline preload="none"></video>
      </div>
    `
  } else if (data.youtubeId) {
    const ytUrl = `https://www.youtube.com/embed/${data.youtubeId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${data.youtubeId}&playsinline=1`
    videoHTML = `
      <div class="hero-video-bg">
        <iframe src="${ytUrl}" loading="lazy" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
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
        <span class="btn-icon" aria-hidden="true">
          <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" focusable="false">
            <path class="btn-arrow-line" d="M4 12h15" />
            <path class="btn-arrow-head" d="M13 6l6 6-6 6" />
          </svg>
        </span>
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
    <h2 class="chapter-card-title"><span class="chapter-card-title-text">${data.chapterTitle}</span></h2>
    <span class="chapter-card-rule" aria-hidden="true"></span>
  `
  return el
}

function renderScene(data, index) {
  const el = document.createElement('div')
  el.className = 'screen screen-scene'
  el.dataset.chapter = data.chapter
  el.dataset.scene = data.scene
  el.dataset.textPosition = data.textPosition
  el.dataset.bg = getBackgroundForScreen(data)

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
  const faviconUrl = '/assets/img/misc/favicon.png'

  el.innerHTML = `
    <button class="ending-favicon" onclick="if(window.stopThemeAudio) window.stopThemeAudio(); window.scrollToScreen(0)" aria-label="Back to start">
      <img src="${faviconUrl}" alt="Favicon" loading="lazy" decoding="async" />
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
      if (!data) return
      const newUrl = getBackgroundForScreen(data)
      if (el.dataset.bg) {
        el.dataset.bg = newUrl
      } else {
        el.style.backgroundImage = `url('${newUrl}')`
        if (el.classList.contains('screen-hero')) loadHeroAnim(el, data)
      }
    })
  }
})
